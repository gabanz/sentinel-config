import {css, html, LitElement} from 'https://unpkg.com/lit-element@2.3.1/lit-element.js?module';
import './sentinel-form.js';
import './sentinel-output.js';

class App extends LitElement {
    static get properties() {
        return {
            loading: {type: Boolean, attribute: false},
            output: {type: String},
        }
    }

    static get styles() {
        return css`
            a {
                color: var(--primary-color);
                text-decoration: none;
            }

            a:hover {
                text-decoration: underline;
            }

            h1, h2 {
                margin: 0;
                padding: 0;
            }

            .title {
                font-size: 2rem;
                font-weight: 700;
                line-height: 1.125;
            }

            .subtitle {
                font-size: 1.25rem;
                font-weight: 400;
                line-height: 1.25;
                color: var(--text-color-light);
            }

            .section {
                padding: 3rem 1.5rem;
            }

            hr {
                display: block;
                height: 2px;
                margin: 1.5rem 0;
                border: none;
                background-color: var(--border-color);
            }

            .row {
                box-sizing: border-box;
                display: flex;
                flex: 0 1 auto;
                flex-direction: row;
                flex-wrap: wrap;
                margin-right: var(--gutter-compensation, -0.5rem);
                margin-left: var(--gutter-compensation, -0.5rem);
            }

            @media screen and (min-width: 48em) {
                .container {
                    width: var(--container-sm, 46rem);
                }
                .col-sm-4 {
                    flex-basis: calc(4 / 12 * 100%);
                    max-width: calc(4 / 12 * 100%);
                }
                .col-sm-8 {
                    flex-basis: calc(8 / 12 * 100%);
                    max-width: calc(8 / 12 * 100%);
                }
            }
        `;
    }

    constructor() {
        super();
        this.loading = false;
        this.output = '';
    }

    render() {
        return html`
            <div class="row">
                <div class="col-sm-4">
                    <section class="section">
        
                        <h1 class="title">Sentinel</h1>
        
                        <h2 class="subtitle">Config Generator</h2>
        
                        <p>
                            This page will generate the necessary Prometheus alerting
                            rules with the data you provide in the form.
                        </p>
                        <br>
                        <sentinel-form ?loading="${this.loading}" @generate="${this.generate}"></sentinel-form>
                        <hr>
                        <p>
                            Based on <a href="https://github.com/metalmatze/slo-libsonnet">SLO-libsonnet</a>
                            and <a href="https://github.com/metalmatze/promtools.dev">Promtools.dev</a>.
                        </p>
                    </section>
                </div>
                <div class="col-sm-8">
                    <section class="section">
                        <sentinel-output .output="${this.output}"></sentinel-output>
                    </section>
                </div>
            </div>`;
    };

    async generate(event) {
        this.loading = true;

        await fetch('/generate', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event.detail)
        })
            .then((resp) => resp.text())
            .then((text) => this.output = text)
            .catch((err) => console.log(err))
            .finally(() => this.loading = false);
    }
}

customElements.define('sentinel-app', App);
