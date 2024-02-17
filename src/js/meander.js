window.onload = function() {
	paper.install(window);
	paper.setup('meanderCanvas');

    const POINT_COUNT 	 = 30;
    const VIEW_MIDDLE 	 = view.size.width / 2;
    const POINT_DISTANCE = view.size.height / (POINT_COUNT / 2);

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function generateMeander(flow) {
        var path = new Path({
            strokeColor: '#3EA4F0',
            strokeWidth: 10,
            strokeCap: 'round'
        });
        
        for (var i = 0; i < POINT_COUNT; i++) {
            var x = getRandomArbitrary(VIEW_MIDDLE - flow, VIEW_MIDDLE + flow);
            var y = i * POINT_DISTANCE;
            var newPoint = new Point(x, y);

            path.add(newPoint);
        }

        path.smooth({ type: 'continuous' });
        return path;
    }

    view.onFrame = function(event) {
        if (flow == 0) return null;
        
        for (var i = 1; i < POINT_COUNT - 1; i++) {
            var segment = meander.segments[i];
            var sinus = Math.sin(event.time * flow + i);

            if (segment.point.x < VIEW_MIDDLE) {
                segment.point.x = (segment.point.x - sinus);
            } else {
                segment.point.x = (segment.point.x + sinus);
            }
        }
        
        meander.smooth();
    }

    const flow = 1;
    const meander = generateMeander(1);
}
