import { IControl, Map as MapboxMap, Style } from "mapbox-gl";

export type MapboxStyleDefinition = {
  title: string;
  uri: string | Style;
};

export type MapboxStyleSwitcherOptions = {
  defaultStyle?: string;
  eventListeners?: MapboxStyleSwitcherEvents;
  preserveLayers?: boolean;
};

type MapboxStyleSwitcherEvents = {
  onOpen?: (event: MouseEvent) => boolean;
  onSelect?: (event: MouseEvent) => boolean;
  onChange?: (event: MouseEvent, style: string) => boolean;
  onBeforeChange?: (event: MouseEvent) => boolean;
};

export class MapboxStyleSwitcherControl implements IControl {
  private static readonly DEFAULT_STYLE = "Streets";
  private static readonly DEFAULT_STYLES = [
    { title: "Dark", uri: "mapbox://styles/mapbox/dark-v10" },
    { title: "Light", uri: "mapbox://styles/mapbox/light-v10" },
    { title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v11" },
    { title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v11" },
    { title: "Streets", uri: "mapbox://styles/mapbox/streets-v11" },
  ];

  private controlContainer: HTMLElement | undefined;
  private events?: MapboxStyleSwitcherEvents;
  private map?: MapboxMap;
  private mapStyleContainer: HTMLElement | undefined;
  private styleButton: HTMLButtonElement | undefined;
  private styles: MapboxStyleDefinition[];
  private defaultStyle: string;
  private preserveLayers: boolean = true;
  private defaultLayerList: Set<string> = new Set();
  private defaultSourcesList: Set<string> = new Set();
  private styleCache: Style;

  constructor(
    styles?: MapboxStyleDefinition[],
    options?: MapboxStyleSwitcherOptions | string
  ) {
    this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
    const defaultStyle =
      typeof options === "string"
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
      (typeof options !== "string" && options?.preserveLayers) ?? true;
  }

  public getDefaultPosition(): string {
    const defaultPosition = "top-right";
    return defaultPosition;
  }

  public onAdd(map: MapboxMap): HTMLElement {
    this.map = map;
    this.controlContainer = document.createElement("div");
    this.controlContainer.classList.add("mapboxgl-ctrl");
    this.controlContainer.classList.add("mapboxgl-ctrl-group");
    this.mapStyleContainer = document.createElement("div");
    this.styleButton = document.createElement("button");
    this.styleButton.type = "button";
    this.mapStyleContainer.classList.add("mapboxgl-style-list");

    this.map.on("load", () => {
      //Store all default/pre-existing built-in mapbox layers (and sources)
      this.defaultSourcesList = new Set(
        Object.keys(map.getStyle().sources || {})
      );
      this.defaultLayerList = new Set(map.getStyle().layers?.map((l) => l.id));
    });

    for (const style of this.styles) {
      const styleElement = document.createElement("button");
      styleElement.type = "button";
      styleElement.innerText = style.title;
      styleElement.classList.add(style.title.replace(/[^a-z0-9-]/gi, "_"));
      styleElement.dataset.uri = JSON.stringify(style.uri);
      styleElement.addEventListener("click", (event) => {
        const srcElement = event.srcElement as HTMLButtonElement;
        this.closeModal();
        if (srcElement.classList.contains("active")) {
          return;
        }
        if (this.events && this.events.onOpen && this.events.onOpen(event)) {
          return;
        }
        //Allow the user to customize onBeforeChange event, but also default to preserving layers
        if (this.events && this.events.onBeforeChange) {
          this.events.onBeforeChange(event); //TODO pass original fn to be extended rather than overridden?
        } else {
          this.styleCache = map.getStyle();
        }
        const style = JSON.parse(srcElement.dataset.uri!);
        this.map!.setStyle(style);
        const elms = this.mapStyleContainer!.getElementsByClassName("active");
        while (elms[0]) {
          elms[0].classList.remove("active");
        }
        srcElement.classList.add("active");

        //NOTE don't try to update the current style until above style is done loading, otherwise map.getStyle returns the old style!
        this.map?.once("styledata", () => {
          //When the base style changes, there could be additional default (mapbox) sources and layers, so update our default cache
          this.defaultSourcesList = new Set(
            [...this.defaultSourcesList].concat(
              Object.keys(map.getStyle().sources || {})
            )
          );
          this.defaultLayerList = new Set(
            [...this.defaultLayerList].concat(
              map.getStyle().layers?.map((l) => l.id) || []
            )
          );

          //Readd all pre-existing layers (and sources), if the user wants to preserve them
          if (this.preserveLayers) {
            this.restoreLayers();
          }
        });

        if (
          this.events &&
          this.events.onChange &&
          this.events.onChange(event, style)
        ) {
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

  public onRemove(): void {
    if (
      !this.controlContainer ||
      !this.controlContainer.parentNode ||
      !this.map ||
      !this.styleButton
    ) {
      return;
    }
    this.styleButton.removeEventListener("click", this.onDocumentClick);
    this.controlContainer.parentNode.removeChild(this.controlContainer);
    document.removeEventListener("click", this.onDocumentClick);
    this.map = undefined;
  }

  private closeModal(): void {
    if (this.mapStyleContainer && this.styleButton) {
      this.mapStyleContainer.style.display = "none";
      this.styleButton.style.display = "block";
    }
  }

  private openModal(): void {
    if (this.mapStyleContainer && this.styleButton) {
      this.mapStyleContainer.style.display = "block";
      this.styleButton.style.display = "none";
    }
  }

  private onDocumentClick(event: MouseEvent): void {
    if (
      this.controlContainer &&
      !this.controlContainer.contains(event.target as Element)
    ) {
      this.closeModal();
    }
  }

  private restoreLayers(): void {
    if (this.styleCache) {
      //Readd sources
      const sources = this.styleCache.sources;
      if (sources) {
        for (const source in sources) {
          if (!this.defaultSourcesList.has(source)) {
            this.map!.addSource(source, sources[source]);
          }
        }
      }

      //Readd layers
      const layers = this.styleCache.layers;
      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          if (!this.defaultLayerList.has(layers[i].id)) {
            this.map!.addLayer(layers[i]);
          }
        }
      }
    }
  }
}
