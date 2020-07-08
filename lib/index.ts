import { IControl, Map as MapboxMap } from "mapbox-gl";

export type MapboxStyleDefinition =
{
    title: string;
    uri: string;
}

export class MapboxStyleSwitcherControl implements IControl
{
    private static readonly DEFAULT_STYLE = "Streets";
    private static readonly DEFAULT_STYLES = [
        { title: "Dark", uri:"mapbox://styles/mapbox/dark-v10"},
        { title: "Light", uri:"mapbox://styles/mapbox/light-v10"},
        { title: "Outdoors", uri:"mapbox://styles/mapbox/outdoors-v11"},
        { title: "Satellite", uri:"mapbox://styles/mapbox/satellite-streets-v11"},
        { title: "Streets", uri:"mapbox://styles/mapbox/streets-v11"}
    ];

    private controlContainer: HTMLElement | undefined;
    private map?: MapboxMap;
    private mapStyleContainer: HTMLElement | undefined;
    private styleButton: HTMLButtonElement | undefined;
    private styles: MapboxStyleDefinition[];

    constructor(styles?: MapboxStyleDefinition[])
    {
        this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    public getDefaultPosition(): string
    {
        const defaultPosition = "top-right";
        return defaultPosition;
    }

    public onAdd(map: MapboxMap): HTMLElement
    {
        this.map = map;
        this.controlContainer = document.createElement("div");
        this.controlContainer.classList.add("mapboxgl-ctrl");
        this.controlContainer.classList.add("mapboxgl-ctrl-group");
        this.mapStyleContainer = document.createElement("div");
        this.styleButton = document.createElement("button");
        this.styleButton.type = "button";
        this.mapStyleContainer.classList.add("mapboxgl-style-list");
        for (const style of this.styles)
        {
            const styleElement = document.createElement("button");
            styleElement.type = "button";
            styleElement.innerText = style.title;
            styleElement.classList.add(style.title.replace(/[^a-z0-9-]/gi, '_'));
            styleElement.dataset.uri = JSON.stringify(style.uri);
            styleElement.addEventListener("click", event =>
            {
                const srcElement = event.srcElement as HTMLButtonElement;
                if (srcElement.classList.contains("active"))
                {
                    return;
                }
                this.map!.setStyle(JSON.parse(srcElement.dataset.uri!));
                this.mapStyleContainer!.style.display = "none";
                this.styleButton!.style.display = "block";
                const elms = this.mapStyleContainer!.getElementsByClassName("active");
                while (elms[0])
                {
                    elms[0].classList.remove("active");
                }
                srcElement.classList.add("active");
            });
            if (style.title === MapboxStyleSwitcherControl.DEFAULT_STYLE)
            {
                styleElement.classList.add("active");
            }
            this.mapStyleContainer.appendChild(styleElement);
        }
        this.styleButton.classList.add("mapboxgl-ctrl-icon");
        this.styleButton.classList.add("mapboxgl-style-switcher");
        this.styleButton.addEventListener("click", () =>
        {
            this.styleButton!.style.display = "none";
            this.mapStyleContainer!.style.display = "block";
        });

        document.addEventListener("click", this.onDocumentClick);

        this.controlContainer.appendChild(this.styleButton);
        this.controlContainer.appendChild(this.mapStyleContainer);
        return this.controlContainer;
    }

    public onRemove(): void
    {
        if (!this.controlContainer || !this.controlContainer.parentNode || !this.map || !this.styleButton)
        {
            return;
        }
        this.styleButton.removeEventListener("click", this.onDocumentClick);
        this.controlContainer.parentNode.removeChild(this.controlContainer);
        document.removeEventListener("click", this.onDocumentClick);
        this.map = undefined;
    }

    private onDocumentClick(event: MouseEvent): void
    {
        if (this.controlContainer && !this.controlContainer.contains(event.target as Element)
            && this.mapStyleContainer && this.styleButton)
        {
            this.mapStyleContainer.style.display = "none";
            this.styleButton.style.display = "block";
        }
    }
}