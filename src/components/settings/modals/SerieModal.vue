<template>
  <div
    class="modal serie-modal"
  >

  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
    }
  },
  mounted() {
    console.log('modal mounted');
  },
  computed: {
    ...mapState('app', ['serieModalId']),
    stat() {
      return this.$store.state.settings.series[this.$store.state.app.serieModalId]
    },
  },
  methods: {

  },
}
</script>

<style lang="scss">
@import '../../../assets/sass/variables';

.serie-modal {

}

</style>
