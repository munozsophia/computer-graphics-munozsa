function handleInput(onChange) {
    document.addEventListener("keydown", (event) => {
        event.preventDefault();
        switch (event.code) {
            case "ArrowUp":
                camera.z += 0.1;
                break;
            case "ArrowDown":
                camera.z -= 0.1;
                break;
            case "ArrowLeft":
                camera.x -= 0.1;
                break;
            case "ArrowRight":
                camera.x += 0.1;
                break;
            case "KeyR":
                resetCamera();
                break;
            case "Space":
                shoot();
                break;
            default:
                return;
        }
        onChange();
    })
}