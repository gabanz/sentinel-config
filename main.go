package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/ghodss/yaml"
	"github.com/go-chi/chi"
	"github.com/go-playground/validator/v10"
	"github.com/google/go-jsonnet"
)

func main() {
	vm := jsonnet.MakeVM()
	vm.Importer(&jsonnet.FileImporter{
		JPaths: []string{"vendor"},
	})

	r := chi.NewRouter()
	r.Get("/", HandleFunc(file("./web/index.html")))
	r.Handle("/web/*", http.StripPrefix("/web", http.FileServer(http.Dir("./web"))))

	r.Post("/generate", HandleFunc(generate(vm)))

	log.Println("Serving on port :9099")

	if err := http.ListenAndServe(":9099", r); err != nil {
		log.Println(err)
	}
}

type HandlerFunc func(http.ResponseWriter, *http.Request) (int, error)

func HandleFunc(h HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		statusCode, err := h(w, r)
		if err != nil {
			http.Error(w, err.Error(), statusCode)
			fmt.Println(err)
			return
		}
		if statusCode != http.StatusOK {
			w.WriteHeader(statusCode)
		}
	}
}

func file(filename string) HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) (int, error) {
		http.ServeFile(w, r, filename)
		return http.StatusOK, nil
	}
}

var alerts = `
local slo = import 'sentinel.libsonnet';
local params = %s;

{
  local alerts = slo.alerts(params),
  rules: alerts.errorburn +
  alerts.latency_originrtt +
  alerts.latency_ttfb +
  alerts.attack +
  alerts.traffic,
}
`

type request struct {
	Availability   float64           `json:"availability" validate:"required,gte=0,lte=100"`
	Zones      map[string]string `json:"zones"`
	OriginRtt      int            `json:"originrtt" validate:"required,gte=0"`
	Ttfb      int            `json:"ttfb" validate:"required,gte=0"`
	Threshold      float64            `json:"threshold" validate:"required,gte=0"`
}

type params struct {
	Target         float64  `json:"target"`
	Availability    string `json:"availability"`
	Zones      []string `json:"zones"`
	OriginRtt      int            `json:"originrtt"`
	Ttfb      int            `json:"ttfb"`
	Threshold      float64            `json:"threshold"`
}

func generate(vm *jsonnet.VM) HandlerFunc {
	validate := validator.New()

	/*
	validate.RegisterStructValidation(func(sl validator.StructLevel) {
		labelNameExp := regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9._-]*$`)

		req := sl.Current().Interface().(request)

		for name := range req.Zones {
			if !labelNameExp.MatchString(name) {
				sl.ReportError(req.Zones, "zone.name", "Zone Name", "label", "")

			}
		}
	}, request{})
	*/

	return func(w http.ResponseWriter, r *http.Request) (int, error) {
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return http.StatusInternalServerError, fmt.Errorf("failed to parse JSON: %w", err)
		}
		defer r.Body.Close()

		if err := validate.Struct(req); err != nil {
			return http.StatusUnprocessableEntity, err
		}

		p := params{
			Target:       req.Availability / 100,
			Availability:    fmt.Sprint(req.Availability),
			OriginRtt:       req.OriginRtt,
			Ttfb:    req.Ttfb,
			Threshold:       req.Threshold,
		}

		for _, zone := range req.Zones {
			p.Zones = append(p.Zones, fmt.Sprintf(`%s`, zone))
		}

		bytes, err := json.Marshal(p)
		if err != nil {
			return http.StatusInternalServerError, fmt.Errorf("failed to marshal request: %w", err)
		}

		snippet := fmt.Sprintf(alerts, string(bytes))
		json, err := vm.EvaluateSnippet("", snippet)
		if err != nil {
			return http.StatusInternalServerError, err
		}

		y, err := yaml.JSONToYAML([]byte(json))
		if err != nil {
			return http.StatusInternalServerError, err
		}

		w.Header().Set("Content-Type", "text/plain")
		_, _ = fmt.Fprintln(w, string(y))

		return http.StatusOK, nil
	}
}
