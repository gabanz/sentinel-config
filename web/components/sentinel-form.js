import {css, html, LitElement, svg} from 'https://unpkg.com/lit-element@2.3.1/lit-element.js?module';
import './ui-button.js';

class Form extends LitElement {
    static get properties() {
        return {
            target: {type: Number},
            unavailability: {type: String},
            zones: {type: Array},
            originrtt: {type: Number},
            ttfb: {type: Number},
            threshold: {type: Number},
            loading: {type: Boolean},
        };
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

            .field {
                margin-bottom: 0.75rem;
            }
            .field.group {
                display: flex;
            }
            .field.group .label {
                padding: 0 0.25rem;
            }
            .field.group .label:first-child {
                padding-left: 0;
            }
            .field.group .label:last-child {
                padding-right: 0;
            }
            .field h3 {
                margin: 0;
            }
            .field h3 svg {
                height: 14px;
                width: 14px;
            }
            .field h3.advanced:hover {
                cursor: pointer;
            }
            .label {
                width: 100%;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 700;
            }
            .control {
                box-sizing: border-box;
                clear:both;
                font-size: 1rem;
                position: relative;
                text-align: left;
            }
            .help {
                font-size: 0.75rem;
                margin-top: 0.25rem;
            }
            .input {
                width: calc(100% - 2*(0.75rem + 1px));
                max-width: 100%;
                padding: 0.5rem 0.75rem;
                box-shadow: inset 0 0.0625em 0.125em var(--border-color);
                border: 1px solid var(--border-color);
                border-radius: 0.25rem;
                color: var(--text-color);
                font-size: 1rem;
                height: 1.5rem;
                line-height: 1.5;
            }
            .input:hover {
                border-color: var(--border-color-hover);
            }
            .input:focus {
                outline: 0;
                border-color: var(--primary-color);
            }
        `;
    }

    constructor() {
        super();
        this.target = 99.9;
        this.zones = [{name: 'example.com'}];
        this.unavailabilityMinutes(this.target);
        this.originrtt = 100;
        this.ttfb = 100;
        this.threshold = 1.1;
    }

    render() {

        return html`
            <form @submit="${this.generate}">
                <div class="field">
                    <label class="label" for="target">
                        <h3>Availability SLO</h3>
                        <div class="control">
                        Unavailability in 30 days: ${this.unavailability}
                            <input class="input" type="number" step="0.01" min="0" max="100" id="target"
                                placeholder="0-100"
                                autofocus
                                .value="${this.target}"
                                @change="${(event) => this.unavailabilityMinutes(parseFloat(event.target.value))}"
                                @keyup="${(event) => this.unavailabilityMinutes(parseFloat(event.target.value))}"
                                ?disabled=${this.loading}
                            />
                        </div>
                    </label>
                    <p class="help">
                        <a href="https://landing.google.com/sre/sre-book/chapters/availability-table/">Availability</a>
                        is generally calculated based on how long a service was unavailable over some period.
                    </p>
                </div>
                <br/>
                <div class="field group">
                    <div style="flex: 1">
                        <h3>Add Zones</h3>
                    </div>
                    <div>
                        <ui-button @click="${this.addZone}">+</ui-button>
                    </div>
                </div>

                ${this.zones.map((zone, i) => html`
                    <div class="field group">
                        <label class="label">Zone Name
                            <div class="control">
                                <input type="text" class="input"
                                    .value="${zone.name}"
                                    ?disabled="${this.loading}"
                                    @change="${(event) => this.updateZone('name', i, event.target.value)}"
                                    @keyup="${(event) => this.updateZone('name', i, event.target.value)}"
                                />
                            </div>
                        </label>
                        <label class="label" style="flex: 1">&nbsp;
                            <div class="control">
                                <ui-button @click="${() => this.deleteZone(i)}">–</ui-button>
                            </div>
                        </label>
                    </div>
                `)}
                <div class="field">
                <label class="label" for="originrtt">
                    <h3>Origin RTT (in ms)</h3>
                    <div class="control">
                        <input class="input" type="number" min="0" id="originrtt"
                            placeholder="100"
                            autofocus
                            .value="${this.originrtt}"
                            @change="${(event) => this.originrtt = parseInt(event.target.value)}"
                            ?disabled=${this.loading}
                        />
                     </div>
                 </label>
                 </div>
                 <div class="field">
                 <label class="label" for="ttfb">
                 <h3>TTFB (in ms)</h3>
                 <div class="control">
                     <input class="input" type="number" min="0" id="ttfb"
                         placeholder="100"
                         autofocus
                         .value="${this.ttfb}"
                         @change="${(event) => this.ttfb = parseInt(event.target.value)}"
                         ?disabled=${this.loading}
                     />
                 </div>
                 </label>
                 </div>
                 <div class="field">
                   <label class="label" for="threshold">
                     <h3>Threshold</h3>
                     <div class="control">
                         <input class="input" type="number" min="0" step="0.1" id="threshold"
                             placeholder="1.1"
                             autofocus
                             .value="${this.threshold}"
                             @change="${(event) => this.threshold = parseFloat(event.target.value)}"
                             ?disabled=${this.loading}
                         />
                     </div>
                   </label>
                 </div>
                <div class="field">
                    <label class="label">
                        <div class="control">
                            <ui-button type="submit" primary ?disabled="${this.loading}" @click="${this.generate}">
                                ${this.loading ? 'Generating...' : 'Generate'}
                            </ui-button>
                        </div>
                    </label>
                </div>
            </form>
        `;
    }

    unavailabilityMinutes(target) {
        this.target = target;

        if (target === 100.0) {
            this.unavailability = "definitely not 100%";
            return;
        }

        const day = 24 * 60 * 60;
        const hour = 60 * 60;
        const minute = 60;

        let seconds = (30 * day) * ((100 - target) / 100);

        if (seconds >= day) {
            this.unavailability = `${Math.floor(seconds / day)}days ${Math.floor((seconds / hour) % 24)}hours`;
            return;
        }
        if (seconds >= hour) {
            this.unavailability = `${Math.floor(seconds / hour)}hours ${Math.floor((seconds / minute) % 60)}min`;
            return;
        }
        if (seconds >= minute) {
            this.unavailability = `${Math.floor(seconds / minute)}min ${Math.floor(seconds % 60)}s`;
            return;
        }
        this.unavailability = `${Math.floor(seconds)}s`;
    }

    generate(event) {
        event.preventDefault();

        let zones = {};
        this.zones.forEach((zone, i) => zones[i] = zone.name);
        let detail = {
            availability: this.target,
            zones: zones,
            originrtt: this.originrtt,
            ttfb: this.ttfb,
            threshold: this.threshold,
        };

        this.dispatchEvent(new CustomEvent('generate', {
            detail: detail,
        }));
    }

    addZone() {
        // Create new array with old array and new selector object
        this.zones = [...this.zones, {name: 'example.com'}];
    }

    deleteZone(index) {
        if (this.zones.length === 1) {
            return;
        }

        // Delete at the index and create a new (immutable) array
        this.zones = [
            ...this.zones.slice(0, index),
            ...this.zones.slice(index + 1)
        ]
    }

    updateZone(field, i, value) {
        if (field === 'name') {
            this.zones[i].name = value;
        }
    }
}

customElements.define('sentinel-form', Form);
