class MercatorMap {
	constructor(params) {
		this.attrs = Object.assign(
			{
				container: 'body',
				id: Math.floor(Math.random() * 10000000),
				width: 400,
				height: 400,
				margin: {
					top: 0,
					left: 0,
					bottom: 30,
					right: 0,
				},
				colors: {
					layers: ['#589A2E'],
					strokeColor: '#ffffff',
					fillColor: '#49D69D',
				},
				mapColors: [],
				featureStrokeWidth: 1,
				basemap: {},
				layer: [],
				zoomExtent: [1, 8],
				objectsField: 'collection',
				onZoom: () => { },
				beforeRender: () => { },
				getTooltipHtml: () => { },
				onPinClick: () => { },
			},
			params
		)
		this.main()
	}




	main(resize) {
		const { attrs } = this

		this.currentTransform = d3.zoomIdentity
		this.container = d3.select(attrs.container)

		this.geoFeatures =
			attrs.basemap.type === 'Topology'
				? topojson.feature(
					attrs.basemap,
					attrs.basemap.objects[attrs.objectsField]
				)
				: attrs.basemap

		this.setDimensions()

		// projection
		this.projection = d3
			.geoMercator()
			.fitSize([this.chartWidth, this.chartHeight], this.geoFeatures)

		// path generator
		this.path = d3.geoPath().projection(this.projection)

		//Add svg
		this.svg = this.container
			.patternify({
				tag: 'svg',
				selector: 'chart-svg',
			})
			.attr('width', attrs.width)
			.attr('height', attrs.height)

		//Add chart group
		this.chart = this.svg
			.patternify({
				tag: 'g',
				selector: 'chart',
			})
			.attr('transform', () => {
				return `translate(${attrs.margin.left},${attrs.margin.top})`
			})

		//Add chart inner group
		this.chartInner = this.chart.patternify({
			tag: 'g',
			selector: 'chart-inner',
		})

		attrs.beforeRender(this.chartInner)

		this.drawFeatures()

		// this.drawLayer(resize)

		const zoom = d3
			.zoom()
			.scaleExtent(attrs.zoomExtent)
			.on('zoom', e => {
				this.chartInner.attr('transform', e.transform)

				const scale = Math.max(1, e.transform.k)

				this.featuresDom.attr('stroke-width', attrs.featureStrokeWidth / scale)

				tippy.hideAll()

				attrs.onZoom(e.transform)
			})
			.on('end', () => { })

		this.zoom = zoom

		if (window.innerWidth > 576) {
			this.svg.call(zoom).on('dblclick.zoom', null)
		} else {
			this.svg.call(zoom).on('dblclick.zoom', null).on('wheel.zoom', null)
		}
	}

	drawFeatures() {
		const { attrs } = this

		const mapContainer = this.chartInner.patternify({
			tag: 'g',
			selector: 'map-container',
		})

		const setColors = d3.scaleQuantile()
			.domain(d3.extent(attrs.data.map((d) => d['Total Instagram hashtags'])))
			.range(attrs.mapColors);

		this.featuresDom = mapContainer.patternify({
			tag: 'path',
			selector: 'feature',
			data: this.geoFeatures.features,
		})
			.attr('stroke', attrs.colors.strokeColor)
			.attr('stroke-width', attrs.featureStrokeWidth / this.currentTransform.k)
			.attr('fill', (d) => {
				const foundCounty = attrs.data.find((county) => d.properties?.NAME_2 === county.County)?.['Total Instagram hashtags']
				if (foundCounty) {
					return setColors(foundCounty)
				} else {
					return '#DA4D4580'
				}
			})
			.style('cursor', 'pointer')
			.attr('d', this.path)
			.attr('data-name', function (d) {
				return d.properties?.NAME_2
			}).each(function (d) {
				const foundCounty = attrs.data.find((county) => d.properties?.NAME_2 === county.County)
				initTooltip(this, attrs.getTooltipHtml(foundCounty))
			})
	}

	highlightTooltip(county) {
		const { attrs } = this
		const specificPathNode = d3.select(`path[data-name='${county}']`).node();
		const foundCounty = attrs.data.find((d) => d.County === county)
		console.log(foundCounty)
		console.log(specificPathNode)
		if (specificPathNode) {
			// Initialize the Tippy.js tooltip on the specific path node
			tippy(specificPathNode, {
				content: attrs.getTooltipHtml(foundCounty),
				allowHTML: true,
				arrow: true,
				theme: 'light',
				animation: 'scale',
				placement: 'top',
				trigger: 'manual'
			}).show();
		} else {
			console.error(`Path node for county '${county}' not found.`);
		}
	}


	scale(scale) {
		this.svg
			.transition()
			.duration(300)
			.call(this.zoom.scaleTo, scale, [
				this.chartWidth / 2,
				this.chartHeight / 2,
			])
	}

	resetZoom() {
		this.svg
			.call(this.zoom.transform, d3.zoomIdentity)
	}

	zoomTo(name) {
		const circle = this.attrs.data.find(d => d.name === name)

		if (circle) {
			const feature = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [circle.Longitude, circle.Latitude],
				},
				properties: {
					name: name,
				},
			}

			const [[x0, y0], [x1, y1]] = this.path.bounds(feature)

			this.svg
				.transition()
				.duration(globals.isMobile ? 350 : 750)
				.call(
					this.zoom.transform,
					d3.zoomIdentity
						.translate(this.chartWidth / 2, this.chartHeight * 0.75)
						.scale(
							Math.min(
								this.attrs.zoomExtent[1],
								0.5 /
								Math.max(
									(x1 - x0) / this.chartWidth,
									(y1 - y0) / this.chartHeight
								)
							)
						)
						.translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
				)
		}
	}

	setDimensions() {
		if (!this.container) return

		let containerRect = this.container.node().getBoundingClientRect()

		if (containerRect.width > 0) {
			this.attrs.width = containerRect.width
		}

		this.attrs.height = this.attrs.width < 576 ? window.innerHeight - 250 : 745

		this.chartWidth =
			this.attrs.width - this.attrs.margin.right - this.attrs.margin.left

		this.chartHeight =
			this.attrs.height - this.attrs.margin.bottom - this.attrs.margin.top
	}

	resize() {
		this.main(true)
		this.resetZoom()
	}

	// highlightPin(highlight) {
	// 	this.pindom.classed('highlighted', d => {
	// 		return d.highlighted = highlight(d)
	// 	}).each(function (d) {
	// 		if (d.highlighted) {
	// 			if (this._tippy) {
	// 				this._tippy.show()
	// 			}
	// 			d3.select(this).raise()
	// 		}
	// 	})
	// }


}