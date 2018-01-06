import PlanetDisplay from "./PlanetDisplay.vue";

module.exports = {
	install(Vue, options) {
		Vue.component("planet-display", PlanetDisplay);
	}
};