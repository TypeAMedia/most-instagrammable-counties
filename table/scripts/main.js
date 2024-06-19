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
			const [newData] = await Promise.all([
				d3.csv('./data/new-data.csv', d3.autoType)
			])

			this.data = newData

			const headers = [
				{
					label: 'Rank',
					icon: './images/rank.svg',
					width: '15%',
					fieldValue: 'Rank'
				},
				{
					label: 'Location',
					icon: './images/location.svg',
					width: '25%',
					fieldValue: 'County'
				},
				{
					label: "Location Type",
					icon: './images/type.svg',
					width: '25%',
					fieldValue: 'Total Instagram hashtags'
				},
				{
					label: 'Hashtags',
					icon: './images/hashtags.svg',
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
			const list = [
				{
					label: 'Town',
					value: 'Towns',
					icon: './images/town.svg'
				},
				{
					label: 'Country Estates',
					value: 'Country estates',
					icon: './images/estates/.svg'
				},
				{
					label: 'Great Trail',
					value: 'Great trail',
					icon: './images/greatTrail.svg'
				},
				{
					label: 'Historic Castles',
					value: 'Historic castles',
					icon: './images/castles.svg'
				},
				{
					label: 'Nature Reserves',
					value: 'Nature reserves',
					icon: './images/reserves.svg'
				}
			]

			this.choice = initDropdown({
				searchPlaceholderValue: 'Search',
				list: list,
				id: '#city_select',
				cb: county => {
					this.map.highlightTooltip(county)
				},
				searchEnabled: true,
			})

			drawTable(headers, newData)
		} catch (e) {
			console.error(e)
		}
	}
}

function drawTable(headers, data) {
	const table = d3.select('#table')

	const filteredData = data.filter((d) => d.Rank !== null)
		.sort((a, b) => a.Rank - b.Rank)
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
