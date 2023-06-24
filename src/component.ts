import { PANOS } from './data'
document.addEventListener('DOMContentLoaded', () => {
    var selectElement = document.getElementById("scene-select")
    console.log("select element: ", selectElement)
    for(let i = 0; i < PANOS.length; i ++) {
        var opt = document.createElement('option');

        opt.text = PANOS[i].id;
        opt.value = PANOS[i].id;
        if(PANOS[i].id === 'mg9u8xta4qznkr54qyi4r56gb') {
            opt.selected = true
        }
        selectElement.add(opt, null);
    }
    console.log("select element: ", selectElement)
});
document.onload = () => {
    console.log("select element: ")
    var selectElement = document.getElementById("scene-select")
    for(let i = 0; i < PANOS.length; i ++) {
        var opt = document.createElement('option');

        opt.text = PANOS[i].id;
        opt.value = PANOS[i].id;

        selectElement.add(opt, null);
    }
    console.log("select element: ", selectElement)
}