<template>
  <div id="app">
    <!-- 路由视图出口 -->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  created() {
    console.log("process.env.NODE_ENV :>> ", process.env.NODE_ENV);
  },
};
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
