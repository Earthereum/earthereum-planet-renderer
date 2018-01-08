<template>
  <div id="app">
    <div class="container">
      <planet-display :planet="planet"></planet-display>
    </div>
  </div>
</template>

<script>
const dat = require("../src/dat.gui.min.js");
const chroma = require("../src/chroma.min.js");
import Planet from "../src/Planet.js";
import PlanetDisplay from "../src/PlanetDisplay";

export default {
  name: 'app',
  data () {
    return {
    }
  },
  created() {
    const planetData = {
        "seed": 0x42069,
        "size": 0.7,
        "water": 0.5,
        "atmoDensity": 0.5,
        "cloudDensity": 0.5,
        "baseColor": 0xa4be92,
        "accColor": 0xf5dac3,
        "numTerrains": 4
    };
    this.planet = new Planet(planetData);
    this.createGui(planetData);
  },
  methods: {
    createGui(traits) {
      let gui = new dat.gui.GUI();
      const update = () => this.planet.rebuild();

      gui.remember(traits);
      gui.add(traits, "seed", 0, 0xFFFFFFFF, 1).onChange(update).listen();
      gui.add(traits, "size", 0, 1).onChange(update).listen();
      gui.add(traits, "water", 0, 1).onChange(update).listen();
      gui.add(traits, "atmoDensity", 0, 1).onChange(update).listen();
      gui.add(traits, "cloudDensity", 0, 1).onChange(update).listen();
      gui.addColor(traits, "baseColor").onChange(update).listen();
      gui.addColor(traits, "accColor").onChange(update).listen();
      gui.add(traits, "numTerrains", 2, 8, 1).onChange(update).listen();

      gui.add({"random": () => {
        traits.seed = Math.floor(Math.random() * 0xFFFFFFFF);
        traits.size = Math.random() * 0.7 + 0.3;
        traits.water = Math.random();
        traits.atmoDensity = Math.random();
        traits.cloudDensity = Math.random();
        traits.baseColor = chroma.random().desaturate(1).css();
        traits.accColor = chroma.random().desaturate(1).css();
        traits.numTerrains = Math.round(Math.random()*6)+2;
        update();
      }}, "random");
    }
  },
  components: {PlanetDisplay}
}
</script>

<style scoped>
.container {
  width: 500px;
  height: 400px;
}
</style>