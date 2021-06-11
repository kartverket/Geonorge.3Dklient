
/* External Components */
import React, {useEffect} from 'react';
import SceneView from '@arcgis/core/views/SceneView';
import WebScene from '@arcgis/core/WebScene';
import Expand from '@arcgis/core/widgets/Expand';
import Slice from '@arcgis/core/widgets/Slice';
import LayerList from '@arcgis/core/widgets/LayerList';
import Search from '@arcgis/core/widgets/Search';
import Daylight from '@arcgis/core/widgets/Daylight';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import ElevationProfile from '@arcgis/core/widgets/ElevationProfile';
import BuildingExplorer from '@arcgis/core/widgets/BuildingExplorer';
import TimeSlider from '@arcgis/core/widgets/TimeSlider';
import Measurement from '@arcgis/core/widgets/Measurement';
import LineOfSight from '@arcgis/core/widgets/LineOfSight';
import FeatureFilter from '@arcgis/core/views/layers/support/FeatureFilter';
import OGCFeatureLayer from '@arcgis/core/layers/OGCFeatureLayer';
import esriConfig from '@arcgis/core/config';

// /* Local Components */
// import Spinner from './Shared/Spinner';
// import {CreateSymbology} from '../utils/MapUtils';

const itemId = '5646d6d4216f4b1f87a7b621b88d972a';
//const itemId = '939ee929770d4de797a94b73bff6d8fd';

const destroyWidget = (widget, button) => {
	if (widget) {
		widget.destroy();
		widget = null;
		if (button) {
			button.classList.remove("active");
		}
	}
	// For some reason, not all widgets become null even after they are set to null here,
	// so the widget is returned here so it can be assigned afterwards to guarantee it will become null
	return widget;
}

const SceneViewer = () => {

    useEffect(() => {
        fetch("../3d/settings.json")
		.then((response) => response.json())
		.then((settings) => {
			// we're not using secure services
			// so save some bytes by not loading/using the identity manager
			// NOTE: this has to be done before even _loading_ other modules
			// esriConfig.request.useIdentity = false;
			esriConfig.portalUrl = settings.agsPortal.url;
			// now we can load the Map and MapView modules
			
			

			let scene = new WebScene({
				portalItem: { // autocasts as new PortalItem()
					id: settings.agsPortal.itemId  // ID of the WebScene on arcgis.com
				}
			});

			const testOGCFeatureLayer = new OGCFeatureLayer({
				url: settings.ogcFeatureLayer.url,
				collectionId: settings.ogcFeatureLayer.collectionId,
				popupTemplate: {
					title: settings.ogcFeatureLayer.popup.title,
					content: [
						{
							type: "fields",
							fieldInfos: settings.ogcFeatureLayer.popup.fields
						}
					]
				}
			});

			scene.add(testOGCFeatureLayer);

			let sceneLayerView;
			let buildingLayer;

			// Create mapView
			new SceneView({
				container: 'scene',
				map: scene,
				// zoom: 4,
				// center: [15, 65] // longitude, latitude
			}).when((sceneView) => {
				sceneView.map.layers.forEach((layer) => {
					if (layer.title === settings.timeSlider.layerName) {
						layer.layers.forEach((subLayer) => {
							sceneView.whenLayerView(subLayer).then((layerView) => {
								if (subLayer.title === settings.timeSlider.subLayerName) {
									sceneLayerView = layerView;
								}
							});
						})
					}
					else if (layer.title === settings.buildingSceneLayer.name) {
						buildingLayer = layer;
					}
				});

				// ----------------------------------- Add search
				const searchWidget = new Search({
					view: sceneView
				});

				sceneView.ui.add(searchWidget, {
					position: "top-left",
					index: 0
				});

					
				// --------------------------------- Add daylight
				const daylightWidget = new Daylight({
					view: sceneView,
					// plays the animation twice as fast than the default one
					playSpeedMultiplier: 2,
					// disable the timezone selection button
					visibleElements: {
					timezone: false
					}
				});
		
				// Add the daylight widget inside of Expand widget
				const expandDaylight = new Expand({
					expandIconClass: "esri-icon-time-clock",
					expandTooltip: "Dagslys",
					view: sceneView,
					content: daylightWidget,
					expanded: false,
					group: "top-left"
				});
				// sceneView.ui.add(expandDaylight, "top-left");
				
					// ----------------------------------Add layer list widget
				var layerList = new LayerList({
					view: sceneView
				});
				// Add widget to the top right corner of the view
				const expandLayerList = new Expand({
					expandIconClass: "esri-icon-layer-list",
					expandTooltip: "Kartlagsliste",
					view: sceneView,
					content: layerList,
					expanded: false,
					group: "top-left"
				});

				// -----------------------------------Add basemap gallery
				const basemapGallery = new BasemapGallery({
					view: sceneView,
				});
				// Add widget to the top right corner of the view
				const expandBaseMap = new Expand({
					expandIconClass: "esri-icon-basemap",
					expandTooltip: "Bakgrunnskart",
					view: sceneView,
					content: basemapGallery,
					expanded: false,
					group: "top-left"
				});
				
				// ---------------------------------- Add slides
				
				const slides = scene.presentation.slides;
				let slidesDiv = document.getElementById("slidesDiv");

				if (slidesDiv) {
					slidesDiv.style.display = "block";
				}

				slides.map((slide, placement) => {
					let slideElement = document.createElement("div");
					// Assign the ID of the slide to the <span> element
					slideElement.id = slide.id;
					slideElement.classList.add("slide");

					if (slidesDiv) {
						if (placement === 0) {
							slidesDiv.insertBefore(slideElement, slidesDiv.firstChild);
						} else {
							slidesDiv.appendChild(slideElement);
						}
					}
					let title = document.createElement("div");
					title.innerText = slide.title.text!;
					// Place the title of the slide in the <div> element
					slideElement.appendChild(title);

					let img = new Image();
					// Set the src URL of the image to the thumbnail URL of the slide
					img.src = slide.thumbnail.url!;
					// Set the title property of the image to the title of the slide
					img.title = slide.title.text!;
					// Place the image inside the new <div> element
					slideElement.appendChild(img);

					slideElement.addEventListener("click", function() {
						let slides = document.querySelectorAll(".slide");
						Array.from(slides).forEach(function(node) {
						node.classList.remove("active");
						});
			
						slideElement.classList.add("active");
			
						slide.applyTo(sceneView);
					});
				});

				const expandSlides = new Expand({
					expandIconClass: "esri-icon-bookmark",
					expandTooltip: "Slides",
					view: sceneView,
					content: slidesDiv!,
					expanded: false,
					group: "top-left"
				});

				// ----------------------------------- Add widgets

				sceneView.ui.add([expandDaylight, expandLayerList, expandBaseMap, expandSlides], "top-left");

				// ----------------------------------- Add widget buttons

				const sliceButton = document.getElementById("slice");
				sceneView.ui.add(sliceButton, "top-right");

				const elevationProfileButton = document.getElementById("elevationProfile");
				sceneView.ui.add(elevationProfileButton, "top-right");

				const buildingExplorerButton = document.getElementById("buildingExplorer");
				sceneView.ui.add(buildingExplorerButton, "top-right");

				const timeSliderButton = document.getElementById("timeSlider");
				sceneView.ui.add(timeSliderButton, "top-right");

				const measurementButton = document.getElementById("measurement");
				sceneView.ui.add(measurementButton, "top-right");

				const lineOfSightButton = document.getElementById("lineOfSight");
				sceneView.ui.add(lineOfSightButton, "top-right");

				let sliceWidget;
				let elevationProfileWidget;
				let buildingExplorerWidget;
				let timeSliderWidget;
				let measurementWidget;
				let lineOfSightWidget;

				// --------------------------------- Add slice widget
				
				if (sliceButton) {
					sliceButton.style.display = "block";
					sliceButton.addEventListener("click", () => {
						if (sliceWidget) {
							sliceWidget = destroyWidget(sliceWidget, sliceButton);
						} else {
							destroyWidget(elevationProfileWidget, elevationProfileButton);
							destroyWidget(buildingExplorerWidget, buildingExplorerButton);
							destroyWidget(timeSliderWidget, timeSliderButton);
							destroyWidget(measurementWidget, measurementButton);
							destroyWidget(lineOfSightWidget, lineOfSightButton);

							sliceWidget = new Slice({
								view: sceneView
							});
							// programmatically add layers that should be excluded from slicing
							// sliceWidget.viewModel.excludedLayers.addMany(excludedLayers);
							sceneView.ui.add(sliceWidget, "top-right");
							sliceButton.classList.add("active");

							// Make sure the other widget buttons is under the active slice widget
							sceneView.ui.move(elevationProfileButton, "top-right");
							sceneView.ui.move(buildingExplorerButton, "top-right");
							sceneView.ui.move(timeSliderButton, "top-right");
							sceneView.ui.move(measurementButton, "top-right");
							sceneView.ui.move(lineOfSightButton, "top-right");
						}
					});
				}

				// --------------------------------- Add elevation profile widget

				if (elevationProfileButton) {
					elevationProfileButton.style.display = "block";
					elevationProfileButton.addEventListener("click", () => {
						if (elevationProfileWidget) {
							elevationProfileWidget = destroyWidget(elevationProfileWidget, elevationProfileButton);
						} else {
							destroyWidget(sliceWidget, sliceButton);
							destroyWidget(buildingExplorerWidget, buildingExplorerButton);
							destroyWidget(timeSliderWidget, timeSliderButton);
							destroyWidget(measurementWidget, measurementButton);
							destroyWidget(lineOfSightWidget, lineOfSightButton);

							elevationProfileWidget = new ElevationProfile({
								view: sceneView,
								unit: "meters"
							});
							// adds the ElevationProfile to the top right corner of the view
							sceneView.ui.add(elevationProfileWidget, "top-right");
							elevationProfileButton.classList.add("active");

							// Make sure the other widget buttons is under the active elevationProfile widget
							sceneView.ui.move(buildingExplorerButton, "top-right");
							sceneView.ui.move(timeSliderButton, "top-right");
							sceneView.ui.move(measurementButton, "top-right");
							sceneView.ui.move(lineOfSightButton, "top-right");
						}
					});
				}

				// --------------------------------- Add building explorer widget

				if (buildingExplorerButton) {
					buildingExplorerButton.style.display = "block";
					buildingExplorerButton.addEventListener("click", () => {
						if (buildingExplorerWidget) {
							buildingExplorerWidget = destroyWidget(buildingExplorerWidget, buildingExplorerButton);	
						} else {
							destroyWidget(sliceWidget, sliceButton);
							destroyWidget(elevationProfileWidget, elevationProfileButton);
							destroyWidget(timeSliderWidget, timeSliderButton);
							destroyWidget(measurementWidget, measurementButton);
							destroyWidget(lineOfSightWidget, lineOfSightButton);

							buildingExplorerWidget = new BuildingExplorer({
								view: sceneView,
								layers: [buildingLayer]
							});
							// adds the BuildingExplorer to the top right corner of the view
							sceneView.ui.add(buildingExplorerWidget, "top-right");
							buildingExplorerButton.classList.add("active");

							// Make sure the other widget buttons is under the active buildingExplorer widget
							sceneView.ui.move(timeSliderButton, "top-right");
							sceneView.ui.move(measurementButton, "top-right");
							sceneView.ui.move(lineOfSightButton, "top-right");
						}
					});
				}

				// --------------------------------- Add time slider widget

				if (timeSliderButton) {
					timeSliderButton.style.display = "block";

					timeSliderButton.addEventListener("click", () => {
						if (timeSliderWidget) {
							timeSliderWidget = destroyWidget(timeSliderWidget, timeSliderButton);
							
							sceneLayerView.filter = null;
						} else {
							destroyWidget(sliceWidget, sliceButton);
							destroyWidget(elevationProfileWidget, elevationProfileButton);
							destroyWidget(buildingExplorerWidget, buildingExplorerButton);
							destroyWidget(measurementWidget, measurementButton);
							destroyWidget(lineOfSightWidget, lineOfSightButton);

							timeSliderWidget = new TimeSlider({
								view: sceneView,
								mode: "instant",
								fullTimeExtent: {
									start: new Date(settings.timeSlider.startYear, 0, 1),
									end: new Date(),
								},
								stops: {
									count: new Date().getFullYear() - settings.timeSlider.startYear
								}
							});

							timeSliderWidget.watch("timeExtent", (value) => {
								const date = new Date(value.start);

								var d = new Date(date),
									month = '' + (d.getMonth() + 1),
									day = '' + d.getDate(),
									year = d.getFullYear();

								if (month.length < 2) 
									month = '0' + month;
								if (day.length < 2) 
									day = '0' + day;

								const dateString = [year, month, day].join('-');

								sceneLayerView.filter = new FeatureFilter({
									where: `${settings.timeSlider.dateField} < date '${dateString}'`
								});
							});

							// adds the TimeSlider to the top right corner of the view
							sceneView.ui.add(timeSliderWidget, "top-right");
							timeSliderButton.classList.add("active");
							
							// Make sure the other widget buttons is under the active timeSlider widget
							sceneView.ui.move(measurementButton, "top-right");
							sceneView.ui.move(lineOfSightButton, "top-right");
						}
					});
				}

				// --------------------------------- Add measurement widget

				if (measurementButton) {
					measurementButton.style.display = "block";
					measurementButton.addEventListener("click", () => {
						if (measurementWidget) {
							measurementWidget = destroyWidget(measurementWidget, measurementButton);
						} else {
							destroyWidget(sliceWidget, sliceButton);
							destroyWidget(elevationProfileWidget, elevationProfileButton);
							destroyWidget(buildingExplorerWidget, buildingExplorerButton);
							destroyWidget(timeSliderWidget, timeSliderButton);
							destroyWidget(lineOfSightWidget, lineOfSightButton);

							measurementWidget = new Measurement({
								view: sceneView,
								activeTool: "direct-line",
								linearUnit: "meters"
							});
							// adds the TimeSlider to the top right corner of the view
							sceneView.ui.add(measurementWidget, "top-right");
							measurementButton.classList.add("active");

							// Make sure the other widget buttons is under the active measurement widget
							sceneView.ui.move(lineOfSightButton, "top-right");
						}
					});
				}

				// --------------------------------- Add lineOfSight widget

				if (lineOfSightButton) {
					lineOfSightButton.style.display = "block";
					lineOfSightButton.addEventListener("click", () => {
						if (lineOfSightWidget) {
							lineOfSightWidget = destroyWidget(lineOfSightWidget, lineOfSightButton);
						} else {
							destroyWidget(sliceWidget, sliceButton);
							destroyWidget(elevationProfileWidget, elevationProfileButton);
							destroyWidget(buildingExplorerWidget, buildingExplorerButton);
							destroyWidget(timeSliderWidget, timeSliderButton);
							destroyWidget(measurementWidget, measurementButton);

							lineOfSightWidget = new LineOfSight({
								view: sceneView
							});
							// adds the TimeSlider to the top right corner of the view
							sceneView.ui.add(lineOfSightWidget, "top-right");
							lineOfSightButton.classList.add("active");
						}
					});
				}
			});
		});
	}, []);

    return (
		<div>
			<div className="client-mapContainer" id="scene"></div>
			<button style={{display: "none"}} className="esri-button" id="slice" type="button" title="Slice layers">
				Slice kartlag
			</button>
			<button style={{display: "none"}} className="esri-button" id="elevationProfile" type="button" title="Høydeprofil">
				Høydeprofil
			</button>
			<button style={{display: "none"}} className="esri-button" id="buildingExplorer" type="button" title="Bygningutforsker">
				Utforsk bygninger
			</button>
			<button style={{display: "none"}} className="esri-button" id="timeSlider" type="button" title="Tidsslider">
				Tids slider
			</button>
			<button style={{display: "none"}} className="esri-button" id="measurement" type="button" title="Måling">
				Gjør måling
			</button>
			<button style={{display: "none"}} className="esri-button" id="lineOfSight" type="button" title="Siktlinjer">
				Siktlinjer
			</button>
			<div  style={{display: "none"}} id="slidesDiv" className="esri-widget"></div>
		</div>
    )
}
  
export default SceneViewer;
