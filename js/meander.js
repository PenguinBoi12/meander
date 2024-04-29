const MEANDER_DEFAULT_SPEED = 100;
const MEANDER_SEGMENT_COUNT = 20;

const DEFAULT_WEIGHT_RANGE  = { "min": "0", "max": "400", "value": "50", "step": "1" };
const DEFAULT_SPEED_RANGE  = { "min": "0", "max": "1000", "value": "50", "step": "1" };
const DEFAULT_LENGTH_RANGE = { "min": "4", "max": "100", "value": "20" };

function normalRiverAlgorithm(path, speed, width, height, segmentCount, curvatures) {
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
    return path;
}

function chaoticRiverAlgorithm(path, speed, width, height, segmentCount, curvatures) {
    let startPoint = new Point(width / 2, 0);
    let segmentLength = height / segmentCount;

    path.moveTo(startPoint);

    for (let i = 0; i < segmentCount + 1; i++) {
        let curvature = curvatures[i];

        if (curvature === undefined) {
            curvature = (Math.random() - 0.5) * 0.2; // Initialize random curvature if not set
            curvatures.push(curvature);
        }

        curvature *= speed; // Adjust curvature based on speed

        const offsetX = Math.sin((i / segmentCount) * Math.PI * 2) * curvature; // Adjust the offset based on speed
        const offsetY = Math.cos((i / segmentCount) * Math.PI * 2) * curvature; // Adjust the offset based on speed
        const nextPoint = new Point(width / 2 + offsetX, (i + 1) * segmentLength + offsetY);

        // Calculate control points
        const lastSegment = path.lastSegment;
        const lastPoint = lastSegment.point;
        const controlPoint1 = lastPoint.add([offsetX * 0.5, offsetY * 0.5]);
        const controlPoint2 = nextPoint.subtract([offsetX * 0.5, offsetY * 0.5]);

        // Create cubic bezier curve
        path.cubicCurveTo(controlPoint1, controlPoint2, nextPoint);
    }

    path.simplify(10);
    path.smooth();

    return path;
}

class Meander {
    constructor(width, height) {
        this.animated = true;
        this.color = "#000000";

        this._speed = MEANDER_DEFAULT_SPEED;
        this._width = width;
        this._height = height;

        this.path = null;
        this.segmentCount = MEANDER_SEGMENT_COUNT;
        this.curvatures = []

        this.algorithm = normalRiverAlgorithm
    }

    generate(curvatures = this.curvatures) {
        const path = new Path({
            strokeColor: this.color,
            strokeWidth: DEFAULT_WEIGHT_RANGE["value"],
            strokeCap: "round"
        });

        if (this.path) {
            path.strokeWidth = this.path.strokeWidth;
            path.dashArray = this.path.dashArray;

            this.path.remove();
        }

        this.curvatures = curvatures;
        this.path = this.algorithm(
            path,
            this._speed,
            this._width, 
            this._height, 
            this.segmentCount,
            this.curvatures
        );
    }

    generateFromPath(path) {
        path.strokeColor = this.color;
        path.strokeWidth = DEFAULT_WEIGHT_RANGE["value"];
        path.strokeCap = "round";

        if (this.path) {
            path.strokeColor = this.path.strokeColor;
            path.strokeWidth = this.path.strokeWidth;
            path.strokeCap = this.path.strokeCap;
            path.dashArray = this.path.dashArray;

            this.path.remove();
        }

        this.path = path;
    }

    add(point) {
        this.path.add(point);
        this.segmentCount += 1;
    }

    setColor(value) {
        this.color = value;
        this.path.strokeColor = this.color;
    }

    setSpeed(value) {
        this._speed = value;

        // for (let i = 1; i < this.segmentCount - 1; i++) {
        //     let segment = this.path.segments[i];

        //     if (segment) {
        //         console.log(segment.point.x);

        //         if (segment.point.x < (this._width / 2)) {
        //             segment.point.x = (segment.point.x - this._speed);
        //         } else {
        //             segment.point.x = (segment.point.x + this._speed);
        //         }
        //     }
        // }

        this.generate(this.curvatures);
    }

    setWeight(value) {
        this.path.strokeWidth = Math.max(value, 1);
    }

    setLength(value) {
        this.segmentCount = value;
        this.generate(this.curvatures);
    }

    setAlgorithm(func) {
        this.algorithm = func;
        this.generate(this.curvatures);
    }

    toggleAnimation() {
        this.animated = !this.animated;
    }
}

window.onload = function() {
    paper.install(window);
    paper.setup("meanderCanvas");

    let drawing = false;

    const settingBox = document.getElementById("settings");
    const lengthInput = document.getElementById("length");
    const speedInput = document.getElementById("speed");
    const algorithmInputGroup = document.getElementById("algorithm");

    const meander = new Meander(view.size.width, view.size.height);
    
    if (!drawing) meander.generate();

    function range(name, options) {
        let range = document.querySelector(`[name='${name}']`);

        range.min = options["min"];
        range.max = options["max"];
        range.step = options["step"];
        range.value = options["value"];

        return range;
    }

    function radio(name, func) {
        document.querySelectorAll(`[name='${name}']`).forEach(element => {
            element.onchange = (e) => func(e.target)
        });
    }

    document.getElementById("generate").onclick = function() {
        if (drawing) {
            meander.generateFromPath(new Path());
            _toggleAnimation(false)
        } else {
            meander.generate();
        }
    }

    document.getElementById("exportSVG").onclick = function() {
        let svg = paper.project.exportSVG({asString: true});
        let url = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
        let link = document.createElement("a");

        link.download = "meander.svg";
        link.href = url;
        
        link.click();
        link.remove();
    }

    document.getElementById("toggleAnimation").onclick = function() {
        _toggleAnimation();
    }

    function _toggleAnimation(animated = null) {
        if (animated == true || animated == false)
            meander.animated = animated;
        else
            meander.toggleAnimation();

        let img = document.getElementById("toggleAnimation").getElementsByTagName("img")[0];
        img.src = meander.animated ? "images/pause.svg" : "images/play.svg"
    }

    document.getElementById("draw").onclick = function() {
        _toggleAnimation(false);
        drawing = true;

        settingBox.classList.add("draw");
        settingBox.classList.remove("line");

        lengthInput.style.display = "none";
        speedInput.style.display = "none";
        algorithmInputGroup.style.display = "none";

        meander.generateFromPath(new Path());
    }

    document.getElementById("line").onclick = function() {
        _toggleAnimation(true);
        drawing = false;

        settingBox.classList.add("line");
        settingBox.classList.remove("draw");

        lengthInput.style.display = "flex";
        speedInput.style.display = "flex";
        algorithmInputGroup.style.display = "flex";

        meander.setLength(MEANDER_SEGMENT_COUNT)
        meander.generate();
    }

    document.getElementById("colorpicker").oninput = function() {
        meander.setColor(this.value);
    }

    range("weight", DEFAULT_WEIGHT_RANGE).oninput = function() {
        meander.setWeight(this.value);
    }

    range("length", DEFAULT_LENGTH_RANGE).oninput = function() {
        meander.setLength(parseInt(this.value));
    }

    range("speed", DEFAULT_SPEED_RANGE).oninput = function() {
        meander.setSpeed(parseInt(this.value));
    };

    radio("trace", (e) => {
        meander.path.dashArray = null;

        if (e.value === "dots") {
            meander.path.dashArray = [0, 100];
        }
    });

    radio("algorithm", (e) => {
        meander.setAlgorithm(e.value === "normal" ? normalRiverAlgorithm : chaoticRiverAlgorithm);
    });

    view.onMouseDrag = function(event) {
        if (!drawing) return null;
        
        meander.add(event.point);
    }

    view.onMouseUp = function(event) {
        if (!drawing) return null;

        meander.path.simplify(5);
        meander.path.smooth();
    }

    view.onFrame = function(event) {
        if (!meander.animated || meander.speed == 0) return;

        for (let i = 1; i < meander.path.segments.length - 1; i++) {
            let segment = meander.path.segments[i];

            if (segment) {
                let sinus = Math.sin(event.time + i);

                if (segment.point.x < (view.size.width / 2)) {
                    segment.point.x = (segment.point.x - sinus);
                } else {
                    segment.point.x = (segment.point.x + sinus);
                }
            }
        }

        meander.path.smooth();
    }
}