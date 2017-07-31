// URL
var url = "https://spreadsheets.google.com/feeds/list/1-5b9LsadveFY3pBz5DXKiOljbkj9odOvdwyN5uc0eAw/od6/public/full?alt=json";

// Placeholders
var pg;
var globalData;
var filteredData;
var filterEl;
var isFiltered = false;
var filterList = [];

// Get Data from Google Sheets (yes, really).
getJSON(url, dataParse);

// Rockin' old school vanilla JS
function getJSON(url, cb) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = function() {
		if (xhr.status >= 200 && xhr.status < 400) {
			var data = JSON.parse(xhr.responseText);
			cb(data);
		} else {
			console.error('error retrieving json data');
		}
	};
	xhr.onerror = function() {
	  console.error('xhr error on connection');
	};
	xhr.send();
}

// Clean the data because their formatting is not user friendly
// Kind of hacky, but so is using Google Sheets as a backend ¯\_(ツ)_/¯
function dataParse(data) {
	var cleanData = [];
	var entryData = data.feed.entry;
	var columns = Object.keys(entryData[0]).filter(function(text) {
		return text.slice(0, 4) === "gsx$";
	});
	var entry;
	for (entry in entryData) {
		var toAdd = {};
		columns.forEach(function(column) {
			if (entryData[entry].hasOwnProperty(column)) {
				toAdd[column.slice(4)] = entryData[entry][column]["$t"];
			}
		});
		cleanData.push(toAdd);
	}
	handleData(cleanData);
}

// Actual data handler
function handleData(data) {
	globalData = data;
	// change slice parameters to limit the data if desired
	// ^ if slicing, be sure to slice globalData too
	makeGallery(data.slice(0));
}

// Create Gallery from Data
function makeGallery(data) {
	var fragment = document.createDocumentFragment();

	var productGallery = document.createElement("div");
	productGallery.classList.add("product-gallery");

	// Templating? Never heard of it.
	data.forEach(function(datum) {
		var productWrapper = document.createElement('div');
		productWrapper.classList.add('product-wrapper');

		var product = document.createElement("div");
		product.classList.add("product");

		var productLink = document.createElement("a");
		productLink.href = datum.url;

		var productImg = document.createElement("figure");
		productImg.classList.add("product-img");
		productImg.style.backgroundImage = 'url("' + datum.image + '")';

		if (datum.price) {
			var productPrice = document.createElement("figcaption");
			productPrice.classList.add("product-price");
			productPrice.textContent = "$" + datum.price;
			productImg.appendChild(productPrice);
		}

		productLink.appendChild(productImg);

		var productInfo = document.createElement("div");
		productInfo.classList.add("product-info");

		var productTitle = document.createElement("h2");
		productTitle.classList.add("product-title");
		productTitle.textContent = datum.title;

		var productDescription = document.createElement("p");
		productDescription.classList.add("product-description");
		productDescription.textContent = datum.description;

		var productTags = document.createElement("span");
		productTags.classList.add("product-tags");

		if (datum.gender.length) {
			productTags.innerHTML +=
				'<span class="product-gender"' +
				'onclick="filterData(event, \'gender\')">' +
				datum.gender +
				'</span> // '
		}

		if (datum.itemtype.length) {
			productTags.innerHTML +=
				'<span class="product-type"' +
				'onclick="filterData(event, \'itemtype\')">' +
				datum.itemtype +
				'</span>'
		}

		if (datum.itemtype.length && datum.itemsubtype.length) {
			productTags.innerHTML += ' // '
		}

		if (datum.itemsubtype.length) {
			productTags.innerHTML +=
				'<span class="product-subtype"' +
				'onclick="filterData(event, \'itemsubtype\')">' +
				datum.itemsubtype +
				'</span>';
		}

		productInfo.appendChild(productTitle);
		productInfo.appendChild(productDescription);
		productInfo.appendChild(productTags);

		product.appendChild(productLink);
		product.appendChild(productInfo);
		productWrapper.appendChild(product);
		productGallery.appendChild(productWrapper);
	});

	fragment.appendChild(productGallery);
	document.body.appendChild(fragment);
	pg = productGallery;

	grid(productGallery);
}

// Use masonry.js cuz it's pretty cool and no longer requires jQuery
function grid(el) {
	var msnry = new Masonry(el, {
	  itemSelector: '.product-wrapper'
	});
}

// Filter data based on the tag they clicked
function filterData(e, tag) {
	var match = e.target.textContent;

	// First filter
	if (!isFiltered) {
		filteredData = globalData.filter(function(data, index) {
			return data[tag] === match;
		});
		filterEl = document.createElement('div');
		filterEl.classList.add('filters');
		filterEl.innerHTML =
			'<button onclick="clearFilters()">' +
		 	'clear' +
			'</button>' +
			'Filtered Results for: ' + match;
		filterList.push(match);
		document.body.appendChild(filterEl);
	}

	// Multi-Filtering, yaasss
	else {
		if (filterList.indexOf(match) !== -1) return;
		filteredData = filteredData.filter(function(data, index) {
			return data[tag] === match;
		});
		filterEl.innerHTML += ' and ' + match;
		filterList.push(match);
	}

	document.body.removeChild(pg);
	makeGallery(filteredData);
	isFiltered = true;
}

// Clear filters and show original set
function clearFilters() {
	document.body.removeChild(pg);
	document.body.removeChild(filterEl)
	makeGallery(globalData);
	isFiltered = false;
	filteredData = [];
	filterList = [];
}
