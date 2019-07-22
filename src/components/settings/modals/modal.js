export default {
  props: ['contextName', 'contextId'],
  created() {
    console.log(this.contextName, 'modal created')
    this._onClickOutside = (event => {
      if (event.target === this.$el) {
        this.close()
      }
    }).bind(this)
  },
  mounted() {
    console.log(this.contextName, 'bind click outside')
    this.$el.addEventListener('click', this._onClickOutside)
  },
  beforeDestroy() {
    console.log(this.contextName, 'unbind click outside')
    this.$el.removeEventListener('click', this._onClickOutside)
  },
  methods: {
    close() {
      console.log(this.contextName, 'close')
      this.$store.dispatch('app/closeModal', this.contextName);
    }
  }
}