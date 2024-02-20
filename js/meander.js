const MEANDER_DEFAULT_SPEED = 100;
const MEANDER_SEGMENT_COUNT = 20;

const DEFAULT_WIDTH_RANGE  = { "min": "0", "max": "50", "value": "5", "step": "1" };
const DEFAULT_SPEED_RANGE  = { "min": "0", "max": "1000", "value": "50", "step": "1" };
const DEFAULT_LENGTH_RANGE = { "min": "4", "max": "50" };


let meander;

let speed = MEANDER_DEFAULT_SPEED;
let segmentCount = MEANDER_SEGMENT_COUNT;

let curvatures = [];

function range(name, options) {
    let range = document.querySelector(`[name='${name}']`);

    range.min = options["min"];
    range.max = options["max"];
    range.step = options["step"];
    range.value = options["value"];

    return range;
}

function generateRiver(speed, width, height) {
    const path = new Path({
        strokeColor: '#000000',
        strokeWidth: 5,
        strokeCap: 'round'
    });

    let startPoint = new Point(width / 2, 0);
    let segmentLength = height / segmentCount;
    
    path.moveTo(startPoint);

    for (let i = 0; i < segmentCount; i++) {
        let curvature = curvatures[i];

        if (curvature === undefined) {
            curvature = (Math.random() - 0.5); // Initialize random curvature if not set
            curvatures.push(curvature);
        }

        curvature *= speed; // Adjust curvature based on speed

        const offsetX = Math.sin((i / segmentCount) * Math.PI) * curvature; // Adjust the offset based on speed
        const nextPoint = new Point(width / 2 + offsetX, (i + 1) * segmentLength);

        path.lineTo(nextPoint);
    }

    path.smooth();

    if (meander) {
        path.strokeWidth = meander.strokeWidth;
        meander.remove();
    }

    meander = path;
}

window.onload = function () {
    paper.install(window);
    paper.setup("meanderCanvas");

    generateRiver(speed, view.size.width, view.size.height);

    document.getElementById("exportSVG").onclick = function() {
        let svg = paper.project.exportSVG({asString: true});
        let url = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
        let link = document.createElement("a");

        link.download = "meander.svg";
        link.href = url;
        
        link.click();
        link.remove();
    }

    range("width", DEFAULT_WIDTH_RANGE).oninput = function() {
        console.log(`Width: ${this.value}`)
        meander.strokeWidth = Math.max(this.value, 1);
    }

    range("length", DEFAULT_LENGTH_RANGE).oninput = function() {
        console.log(`Length: ${this.value}`)

        segmentCount = parseInt(this.value);
        generateRiver(speed, view.size.width, view.size.height);
    }

    range("speed", DEFAULT_SPEED_RANGE).oninput = function() {
        console.log(`Speed: ${this.value}`);

        speed = parseInt(this.value);
        generateRiver(speed, view.size.width, view.size.height);
    };
}