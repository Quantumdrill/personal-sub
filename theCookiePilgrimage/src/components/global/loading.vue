<script setup>

</script>
<template>
    <div id="loadingContainer">
        <div id="loadingText">Loading...</div>
    </div>
</template>
<style scoped>

#loadingContainer{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    opacity: 0.8;
    z-index: 5;
}

#loadingText{
    font-size: 2vw;
    height: 2vw;
    color: #fff;
    text-align: center;
}

</style>