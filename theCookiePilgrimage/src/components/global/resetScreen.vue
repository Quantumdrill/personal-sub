<script setup>

</script>
<template>
    <div id="resetScreenContainer">
        <div id="resetScreenText">Refresh page to reset this level</div>
    </div>
</template>
<style scoped>

#resetScreenContainer{
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

#resetScreenText{
    font-size: 2vw;
    height: 2vw;
    color: #fff;
    text-align: center;
}

</style>