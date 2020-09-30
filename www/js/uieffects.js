const position = { x: 0, y: 0 }

interact('.draggable').draggable({
    listeners: {
        start(event) {
            console.log(event.type, event.target)
        },
        move(event) {
            position.x += event.dx
            // position.y += event.dy

            event.target.style.transform =
                `translate(${position.x}px, ${position.y}px)`
        },
    },
    modifiers: [
        interact.modifiers.restrictEdges({
            inner: {
                left: 100, // the left edge must be <= 100
                right: 200, // the right edge must be >= 200
            },
            outer: {
                left: 0, // the left edge must be >= 0
                right: 300, // the right edge must be <= 300
            },
        })
    ],
})