class App {
	constructor() {
		this.zoomExtent = [0.9, 8]
		this.currentScale = 1
		this.zoomStep = 0.5

		this.loadDataAndInit()

		let timer = null

		d3.select(window).on('resize.map', () => {
			if (timer) clearTimeout(timer)
			timer = setTimeout(() => {
				this.map?.resize()
			}, 100)
		})
	}

	async loadDataAndInit() {
		try {
			const [mapjson, newData] = await Promise.all([
				d3.json('./data/uk-counties.json'),
				d3.csv('./data/new-data.csv', d3.autoType)
			])

			this.data = newData

			const newMapJson = {
				type: "FeatureCollection",
				features: mapjson.features.filter((d) => d.properties.NAME_2 !== 'Shetland Islands')
			}

			const headers = [
				{
					label: 'Rank',
					icon: './images/rank.svg',
					width: '15%',
					fieldValue: 'Rank'
				},
				{
					label: 'County',
					icon: './images/pin.svg',
					width: '25%',
					fieldValue: 'County'
				},
				{
					label: "Hashtags",
					icon: './images/hashtag.svg',
					width: '25%',
					fieldValue: 'Total Instagram hashtags'
				},
				{
					label: 'Most Instagrammed Town',
					icon: './images/photo.svg',
					width: '35%',
					fieldValue: 'Town'
				}
			]
			const regionObj = Array.from(new Set(newData.slice().map((d) => d.Region)))
			console.log(regionObj)


			const listOptions = d3.rollups(
				newData,
				arr => arr
					.sort((a, b) => {
						return d3.ascending(a.County, b.County)
					})
					.map(d => ({
						label: d.County,
						value: d.County,
					})),
				d => d.Region
			).map((d, i) => ({
				label: d[0],
				id: i + 1,
				choices: d[1]
			})).sort((a, b) => regionObj.indexOf(a.label) - regionObj.indexOf(b.label))

			this.choice = initDropdown({
				searchPlaceholderValue: 'Search',
				placeholder: `<div class='choice-label'>
				<svg width="19" height="25" viewBox="0 0 19 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.50001 0.844666C4.38931 0.844666 0.225006 5.00897 0.225006 10.1197C0.225006 14.1447 4.18036 19.2554 6.80536 22.65L6.98036 22.8606C7.57508 23.6658 8.5198 24.1211 9.50008 24.1211C10.4804 24.1211 11.4251 23.6658 12.0198 22.8606C12.1948 22.6158 12.3698 22.4053 12.5804 22.1606C15.2054 18.8 18.775 14.1802 18.775 10.1213C18.775 5.01056 14.6107 0.844666 9.50001 0.844666ZM11.8106 21.5643C11.6356 21.809 11.425 22.0538 11.25 22.2643C10.8303 22.8249 10.2 23.1393 9.50001 23.1393C8.80001 23.1393 8.16973 22.8249 7.75001 22.2643L7.57501 22.0538C5.01973 18.7643 1.20536 13.7931 1.20536 10.1181C1.20536 5.56807 4.91606 1.82342 9.50001 1.82342C14.0857 1.82342 17.7947 5.53412 17.7947 10.1181C17.7947 13.8641 14.3304 18.3104 11.8106 21.5643Z" fill="#324C3D"/>
<path d="M9.5 6.13037C7.33028 6.13037 5.58035 7.88037 5.58035 10.05C5.58035 12.2197 7.33035 13.9697 9.5 13.9697C11.6697 13.9697 13.4197 12.2197 13.4197 10.05C13.4197 7.88037 11.6697 6.13037 9.5 6.13037ZM9.5 12.9897C7.88944 12.9897 6.56056 11.6594 6.56056 10.0502C6.56056 8.43967 7.89084 7.11079 9.5 7.11079C11.1106 7.11079 12.4394 8.44107 12.4394 10.0502C12.4394 11.6608 11.1105 12.9897 9.5 12.9897Z" fill="#324C3D"/>
</svg>
			<div>	Select County </div>
				</div>`,
				list: listOptions,
				id: '#city_select',
				cb: county => {
					this.map.highlightTooltip(county)
				},
				searchEnabled: true,
			})

			this.map = new MercatorMap({
				container: '#map',
				basemap: newMapJson,
				data: this.data,
				mapColors: ['#DA4D45', '#DA4D4580', '#324C3D80', '#324C3D'],
				zoomExtent: this.zoomExtent,
				getTooltipHtml: d => {
					return `<div class='tooltip-box'>
					<div class='tooltip-title'> <span class='tooltip-span'> ${d?.County}</span>, ${d?.Region} </div>

					<div class='tooltip-rank'> 
					<div class='tooltip-line'> 
					<div class='tooltip-line-title'>
					<img src='./images/rank.svg' />
					<div> Rank </div>
					</div>
					${d?.Rank}${get_ordinal_suffix(d)}
					</div> 


					<div class='tooltip-line'> 
					<div class='tooltip-line-title'>
					<img src='./images/hashtag.svg' />
					<div> Hashtags </div>
					</div>
					${formatThousand(d?.['Total Instagram hashtags'])}
					</div> 

					<div class='tooltip-line'> 
					<div class='tooltip-line-title'>
					<img src='./images/photo.svg' class='tooltip-icon' />
					<div class='tooltip-label'> Most Instagrammed Town </div>
					</div>
					<div class='tooltip-value'> ${d?.Town} </div>
					</div> 
					

					</div>
					</div> 
					
					`
				}
			})

			drawTable(headers, newData.slice().sort((a, b) => b['Total Instagram hashtags'] - a['Total Instagram hashtags'])),
				this.initZoomBtns()
		} catch (e) {
			console.error(e)
		}
	}
	updateZoomBtns() {
		if (this.map) {
			d3.select('#zoom_in').property(
				'disabled',
				this.currentScale >= this.zoomExtent[1]
			)
			d3.select('#zoom_out').property(
				'disabled',
				this.currentScale <= this.zoomExtent[0]
			)
		}
	}
	initZoomBtns() {
		this.updateZoomBtns()

		d3.select('#zoom_in').on('click', () => {
			this.currentScale = Math.min(
				this.zoomExtent[1],
				this.currentScale + this.zoomStep
			)
			this.map && this.map.scale(this.currentScale)
			this.updateZoomBtns()
		})

		d3.select('#zoom_out').on('click', () => {
			this.currentScale = Math.max(
				this.zoomExtent[0],
				this.currentScale - this.zoomStep
			)

			this.map && this.map.scale(this.currentScale)
			this.updateZoomBtns()
		})
	}
}

function drawTable(headers, data) {
	const table = d3.select('#table')

	const filteredData = data.filter((d) => d.Rank !== null)
		.sort((a, b) => b['Total Instagram hashtags'] - a['Total Instagram hashtags'])
		.filter((d, index) => index <= 9)


	// Create headers
	const header = table
		.selectAll('div.table-header')
		.data(headers)
		.join('div')
		.attr('class', (d, index) => `table-header ${d.label}_`)
		.style('flex', (d) => `2 2 ${d.width}`)
		.style('text-align', 'center')
		.html(d => `
			<img class='table-icon' src='${d.icon}'/>
			<div class='table-label'> ${d.label} </div>
		`)

	header.each(function (headerData) {
		const header = d3.select(this)
		const tableRows = header
			.selectAll('.table-row')
			.data(filteredData)
			.join('div')
			.attr('class', 'table-row')

		tableRows
			.selectAll('.table-cell')
			.data(d => [d[headerData.fieldValue]])
			.join('div')
			.attr('class', `table-cell ${headerData.fieldValue}`)
			.html(d => {
				if (headerData.fieldValue === 'Total Instagram hashtags') {
					return formatThousand(d)
				} else if (headerData.fieldValue === 'Rank') {
					return `${d}${get_ordinal_suffix(d)}`
				} else return d
			})
	})
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new App()
	window.app = app
})
