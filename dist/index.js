"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapboxStyleSwitcherControl = void 0;
class MapboxStyleSwitcherControl {
    constructor(styles, options) {
        var _a;
        this.preserveLayers = true;
        this.defaultLayerList = new Set();
        this.defaultSourcesList = new Set();
        this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
        const defaultStyle = typeof options === "string"
            ? options
            : options
                ? options.defaultStyle
                : undefined;
        this.defaultStyle =
            defaultStyle || MapboxStyleSwitcherControl.DEFAULT_STYLE;
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.events =
            typeof options !== "string" && options
                ? options.eventListeners
                : undefined;
        this.preserveLayers =
            (_a = (typeof options !== "string" && (options === null || options === void 0 ? void 0 : options.preserveLayers))) !== null && _a !== void 0 ? _a : true;
    }
    getDefaultPosition() {
        const defaultPosition = "top-right";
        return defaultPosition;
    }
    onAdd(map) {
        this.map = map;
        this.controlContainer = document.createElement("div");
        this.controlContainer.classList.add("mapboxgl-ctrl");
        this.controlContainer.classList.add("mapboxgl-ctrl-group");
        this.mapStyleContainer = document.createElement("div");
        this.styleButton = document.createElement("button");
        this.styleButton.type = "button";
        this.mapStyleContainer.classList.add("mapboxgl-style-list");
        this.map.on("load", () => {
            var _a;
            this.defaultSourcesList = new Set(Object.keys(map.getStyle().sources || {}));
            this.defaultLayerList = new Set((_a = map.getStyle().layers) === null || _a === void 0 ? void 0 : _a.map((l) => l.id));
        });
        for (const style of this.styles) {
            const styleElement = document.createElement("button");
            styleElement.type = "button";
            styleElement.innerText = style.title;
            styleElement.classList.add(style.title.replace(/[^a-z0-9-]/gi, "_"));
            styleElement.dataset.uri = JSON.stringify(style.uri);
            styleElement.addEventListener("click", (event) => {
                var _a;
                const srcElement = event.srcElement;
                this.closeModal();
                if (srcElement.classList.contains("active")) {
                    return;
                }
                if (this.events && this.events.onOpen && this.events.onOpen(event)) {
                    return;
                }
                if (this.events && this.events.onBeforeChange) {
                    this.events.onBeforeChange(event);
                }
                else {
                    this.styleCache = map.getStyle();
                }
                const style = JSON.parse(srcElement.dataset.uri);
                this.map.setStyle(style);
                const elms = this.mapStyleContainer.getElementsByClassName("active");
                while (elms[0]) {
                    elms[0].classList.remove("active");
                }
                srcElement.classList.add("active");
                (_a = this.map) === null || _a === void 0 ? void 0 : _a.once("styledata", () => {
                    var _a;
                    this.defaultSourcesList = new Set([...this.defaultSourcesList].concat(Object.keys(map.getStyle().sources || {})));
                    this.defaultLayerList = new Set([...this.defaultLayerList].concat(((_a = map.getStyle().layers) === null || _a === void 0 ? void 0 : _a.map((l) => l.id)) || []));
                    if (this.preserveLayers) {
                        this.restoreLayers();
                    }
                });
                if (this.events &&
                    this.events.onChange &&
                    this.events.onChange(event, style)) {
                    return;
                }
            });
            if (style.title === this.defaultStyle) {
                styleElement.classList.add("active");
            }
            this.mapStyleContainer.appendChild(styleElement);
        }
        this.styleButton.classList.add("mapboxgl-ctrl-icon");
        this.styleButton.classList.add("mapboxgl-style-switcher");
        this.styleButton.addEventListener("click", (event) => {
            if (this.events && this.events.onSelect && this.events.onSelect(event)) {
                return;
            }
            this.openModal();
        });
        document.addEventListener("click", this.onDocumentClick);
        this.controlContainer.appendChild(this.styleButton);
        this.controlContainer.appendChild(this.mapStyleContainer);
        return this.controlContainer;
    }
    onRemove() {
        if (!this.controlContainer ||
            !this.controlContainer.parentNode ||
            !this.map ||
            !this.styleButton) {
            return;
        }
        this.styleButton.removeEventListener("click", this.onDocumentClick);
        this.controlContainer.parentNode.removeChild(this.controlContainer);
        document.removeEventListener("click", this.onDocumentClick);
        this.map = undefined;
    }
    closeModal() {
        if (this.mapStyleContainer && this.styleButton) {
            this.mapStyleContainer.style.display = "none";
            this.styleButton.style.display = "block";
        }
    }
    openModal() {
        if (this.mapStyleContainer && this.styleButton) {
            this.mapStyleContainer.style.display = "block";
            this.styleButton.style.display = "none";
        }
    }
    onDocumentClick(event) {
        if (this.controlContainer &&
            !this.controlContainer.contains(event.target)) {
            this.closeModal();
        }
    }
    restoreLayers() {
        if (this.styleCache) {
            const sources = this.styleCache.sources;
            if (sources) {
                for (const source in sources) {
                    if (!this.defaultSourcesList.has(source)) {
                        this.map.addSource(source, sources[source]);
                    }
                }
            }
            const layers = this.styleCache.layers;
            if (layers) {
                for (let i = 0; i < layers.length; i++) {
                    if (!this.defaultLayerList.has(layers[i].id)) {
                        this.map.addLayer(layers[i]);
                    }
                }
            }
        }
    }
}
exports.MapboxStyleSwitcherControl = MapboxStyleSwitcherControl;
MapboxStyleSwitcherControl.DEFAULT_STYLE = "Streets";
MapboxStyleSwitcherControl.DEFAULT_STYLES = [
    { title: "Dark", uri: "mapbox://styles/mapbox/dark-v10" },
    { title: "Light", uri: "mapbox://styles/mapbox/light-v10" },
    { title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v11" },
    { title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v11" },
    { title: "Streets", uri: "mapbox://styles/mapbox/streets-v11" },
];
//# sourceMappingURL=index.js.map
