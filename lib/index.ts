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
        { title: "Dark", uri:"mapbox://styles/mapbox/dark-v9"},
        { title: "Light", uri:"mapbox://styles/mapbox/light-v9"},
        { title: "Outdoors", uri:"mapbox://styles/mapbox/outdoors-v10"},
        { title: "Satellite", uri:"mapbox://styles/mapbox/satellite-streets-v10"},
        { title: "Streets", uri:"mapbox://styles/mapbox/streets-v10"}
    ];

    private controlContainer: HTMLElement | undefined;
    private styles: MapboxStyleDefinition[];

    constructor(styles?: MapboxStyleDefinition[])
    {
        this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
    }

    public getDefaultPosition(): string
    {
        const defaultPosition = "top-right";
        return defaultPosition;
    }

    public onAdd(map: MapboxMap): HTMLElement
    {
        this.controlContainer = document.createElement("div");
        this.controlContainer.classList.add("mapboxgl-ctrl");
        this.controlContainer.classList.add("mapboxgl-ctrl-group");
        const mapStyleContainer = document.createElement("div");
        const styleButton = document.createElement("button");
        mapStyleContainer.classList.add("mapboxgl-style-list");
        for (const style of this.styles)
        {
            const styleElement = document.createElement("button");
            styleElement.innerText = style.title;
            styleElement.classList.add(style.title.replace(/[^a-z0-9-]/gi, ''));
            styleElement.dataset.uri = style.uri;
            styleElement.addEventListener("click", event =>
            {
                const srcElement = event.srcElement as HTMLButtonElement;
                map.setStyle(JSON.parse(srcElement.dataset.uri!));
                mapStyleContainer.style.display = "none";
                styleButton.style.display = "block";
                const elms = mapStyleContainer.getElementsByClassName("active");
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
            mapStyleContainer.appendChild(styleElement);
        }
        styleButton.classList.add("mapboxgl-ctrl-icon");
        styleButton.classList.add("mapboxgl-style-switcher");
        styleButton.addEventListener("click", () =>
        {
            styleButton.style.display = "none";
            mapStyleContainer.style.display = "block";
        });

        document.addEventListener("click", event =>
        {
            if (!this.controlContainer!.contains(event.target as Element))
            {
                mapStyleContainer.style.display = "none";
                styleButton.style.display = "block";
            }
        });

        this.controlContainer.appendChild(styleButton);
        this.controlContainer.appendChild(mapStyleContainer);
        return this.controlContainer;
    }

    public onRemove(): void
    {
        return;
    }
}