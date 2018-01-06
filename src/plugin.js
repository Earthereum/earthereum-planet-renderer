import PlanetDisplay from "./PlanetDisplay.vue";
import Planet from "./Planet.js";
import Particle from "./Particle.js";
import OrbitControls from "./OrbitControls.js";
import Noise from "./Noise.js";

module.exports = {
	install(Vue, options) {
		Vue.component("planet-display", PlanetDisplay);
	}
};