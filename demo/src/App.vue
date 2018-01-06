<template>
  <div id="app">
    <planet-display :planet="planet"></planet-display>
  </div>
</template>

<script>
import Planet from "earthereum-renderer/Planet";
import PlanetDisplay from "earthereum-renderer/PlanetDisplay";

export default {
  name: 'app',
  data () {
    return {
      planet: null
    }
  },
  created() {
    this.planet = new Planet({
        "seed": 0x42069,
        "size": 0.7,
        "water": 0.5,
        "atmoDensity": 0.5,
        "cloudDensity": 0.5,
        "baseColor": 0xa4be92,
        "accColor": 0xf5dac3,
        "numTerrains": 4
    });
  },
  components: {PlanetDisplay}
}
</script>

<style>
</style>