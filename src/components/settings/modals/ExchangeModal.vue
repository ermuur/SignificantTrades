<template>
  <div
    class="modal exchange-modal"
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
    ...mapState('app', ['exchangeModalId']),
    stat() {
      return this.$store.state.settings.exchange[this.$store.state.app.exchangeModalId]
    },
  },
  methods: {

  },
}
</script>

<style lang="scss">
@import '../../../assets/sass/variables';

.exchange-modal {

}

</style>
