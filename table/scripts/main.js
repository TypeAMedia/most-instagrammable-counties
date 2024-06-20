class App {
	constructor() {
		this.sortType = 'Towns and villages'
		this.attr = 'all'
		this.loadDataAndInit()
	}

	async loadDataAndInit() {
		try {
			const [countrysideData] = await Promise.all([
				d3.csv('./data/countryside.csv', d3.autoType)
			])

			this.data = countrysideData


			// Table headers
			const headers = [
				{
					label: 'Rank',
					icon: './images/rank.svg',
					width: '8%',
					fieldValue: 'Rank'
				},
				{
					label: 'Location',
					icon: './images/location.svg',
					width: '20%',
					fieldValue: 'Name of location'
				},
				{
					label: "Location Type",
					icon: './images/type.svg',
					width: '40%',
					fieldValue: 'Type'
				},
				{
					label: 'Hashtags',
					icon: './images/hashtags.svg',
					width: '25%',
					fieldValue: 'Number of instagram hashtags'
				}
			]

			// Dropdown list
			const list = [
				{
					label: `<div> <img src=${'./images/town.svg'} <div> Towns and Villages </div> </div>`,
					value: 'Towns and villages',
					icon: './images/town.svg'
				},
				{
					label: `<div> <img src=${'./images/estates.svg'} <div> Country Estates </div> </div>`,
					value: 'Country estates',
					icon: './images/estates/.svg'
				},
				{
					label: `<div> <img src=${'./images/greatTrail.svg'} <div> Great Trail </div> </div>`,
					value: 'Great Trails',
					icon: './images/greatTrail.svg'
				},
				{
					label: `<div> <img src=${'./images/castles.svg'} <div> Historic Castles </div> </div>`,
					value: 'Castles',
					icon: './images/castles.svg'
				},
				{
					label: `<div> <img src=${'./images/reserves.svg'} <div> Nature Reserves </div> </div>`,
					value: 'Nature reserves',
					icon: './images/reserves.svg'
				}
			]

			let length = 10

			// Initial table
			drawTable(headers, countrysideData, this.attr || 'all', this.sortType || 'Towns and villages')

			// Handle show more button
			d3.select('#show_more')
				.on('click', function (e) {
					if (length < countrysideData.length) {
						d3.select(e.target).html('Show more')
						length = length + 10
					} else {
						if (length === countrysideData.length) {
							d3.select(e.target).html('Show less')
							length = length - 10
						}
					}

					drawTable(headers, countrysideData, this.attr || 'all', this.sortType || 'Towns and villages')
				})

			//Handle dropdown
			this.choice = initDropdown({
				list: list,
				id: '#city_select',
				cb: type => {
					length = 10
					this.sortType = type
					drawTable(headers, countrysideData, this.attr || 'all', type)
				},
			})

			// Handle country boxes 
			const countryBoxes = d3.selectAll('.country-box')
			countryBoxes.on('click', (e) => {
				length = 10
				countryBoxes.classed('active', false)
				d3.select(e.target).classed('active', true)
				this.attr = d3.select(e.target).attr('data-target')
				drawTable(headers, countrysideData, this.attr, this.sortType)
			})

			// Draw Table
			function drawTable(headers, data, country, type) {
				const table = d3.select('#table')
				const filteredData = data
					.filter((d) => {
						if (country === 'all') {
							return true;
						} else {
							return d.Country === country
						}
					})
					.filter((d) => d.Type === type)
					.slice(0, length)
					.sort((a, b) => b['Number of instagram hashtags'] - a['Number of instagram hashtags'])
					.map((d, index) => {
						return {
							...d,
							Rank: index + 1
						}
					})

				// Create headers
				const header = table
					.selectAll('div.table-header')
					.data(headers)
					.join('div')
					.attr('class', (d, index) => `table-header ${d.label}_`)
					.style('flex', (d) => `2 2 ${d.width}`)
					.style('text-align', 'center')
					.html(d => `
					<div class='header'>
						<img class='table-icon' src='${d.icon}'/>
						<div class='table-label'> ${d.label} </div>
						</div>
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
							if (headerData.fieldValue === 'Number of instagram hashtags') {
								return formatThousand(d)
							} else if (headerData.fieldValue === 'Rank') {
								return `${d}${get_ordinal_suffix(d)}`
							} else if (headerData.fieldValue === 'Name of location') {
								const place = filteredData.find((x) => x['Name of location'] === d)
								return `
								<div class='place'> <div>${d} </div> <div class='county'> ${place.County},  ${place.Country} </div> </div> `
							}
							else return d
						})
				})
			}

		} catch (e) {
			console.error(e)
		}
	}
}



document.addEventListener('DOMContentLoaded', () => {
	new App()
})
