function setup() {
    "use strict";
    /* global glMatrix */
    var canvas = document.getElementById("myCanvas");
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;
    var context = canvas.getContext('2d');
    var tparam = 0;

    function draw() {
        canvas.width = canvas.width; // Reset the screen

        function moveToTx(loc, Tx) {
            var res=vec3.create(); vec3.transformMat4(res,loc,Tx); context.moveTo(res[0],res[1]);
        }

        function lineToTx(loc, Tx) {
            var res=vec3.create(); vec3.transformMat4(res,loc,Tx); context.lineTo(res[0],res[1]);
        }

        function drawRocket(color, TxU) {
            context.beginPath();
            context.fillStyle = "#a3a3a3";
            context.ellipse(0, 0, 5, 15, Math.PI, 0, 2*Math.PI);
            context.closePath();
            context.fill();
            context.beginPath();
            context.fillStyle = "#b8fffb";
            context.strokeStyle = "black";
            context.arc(0, -7, 3, 0, 2*Math.PI);
            context.closePath();
            context.fill();
            context.stroke();
            context.beginPath();
            moveToTx([-3, -12], TxU);
            lineToTx([3, -12], TxU);
            lineToTx([0, -18], TxU);
            context.closePath();
            context.fillStyle = color;
            context.fill();
            context.beginPath();
            moveToTx([-3, 12], TxU);
            lineToTx([-5, 17], TxU);
            lineToTx([-1, 14], TxU);
            lineToTx([1, 14], TxU);
            lineToTx([5, 17], TxU);
            lineToTx([3, 12], TxU);
            context.closePath();
            context.fill();
        }

        var Hermite = function(t) {
            return [
                2*t*t*t-3*t*t+1,
		        t*t*t-2*t*t+t,
		        -2*t*t*t+3*t*t,
		        t*t*t-t*t
	        ];
        };
        var HermiteDerivative = function(t) {
            return [
                6*t*t-6*t,
                3*t*t-4*t+1,
                -6*t*t+6*t,
                3*t*t-2*t
            ];
        };
        function Cubic(basis, P, t) {
            var b = basis(t);
            var result = vec3.create();
            vec3.scale(result, P[0], b[0]);
            vec3.scaleAndAdd(result, result, P[1], b[1]);
            vec3.scaleAndAdd(result, result, P[2], b[2]);
            vec3.scaleAndAdd(result, result, P[3], b[3]);
            return result;
        }

        var p_ = [[100, 80, 60], [-50, 40, 80], [-60, 50, -60], [20, 70, -50], [40, 50, 20]];
        var d_ = [[-10, -10, 50], [-20, 0, -40], [0, 25, -50], [50, 10, 0], [20, 0, 30]];
        var P_ = [[p_[0], d_[0], p_[1], d_[1]], [p_[1], d_[1], p_[2], d_[2]], [p_[2], d_[2], p_[3], d_[3]], [p_[3], d_[3], p_[4], d_[4]], [p_[4], d_[4], p_[0], d_[0]]];

        var C0 = function (t) {return Cubic(Hermite, P_[0], t);};
        var C1 = function (t) {return Cubic(Hermite, P_[1], t);};
        var C2 = function (t) {return Cubic(Hermite, P_[2], t);};
        var C3 = function (t) {return Cubic(Hermite, P_[3], t);};
        var C4 = function (t) {return Cubic(Hermite, P_[4], t);};

        var C0_p = function (t) {return Cubic(HermiteDerivative, P_[0], t);};
        var C1_p = function (t) {return Cubic(HermiteDerivative, P_[1], t);};
        var C2_p = function (t) {return Cubic(HermiteDerivative, P_[2], t);};
        var C3_p = function (t) {return Cubic(HermiteDerivative, P_[3], t);};
        var C4_p = function (t) {return Cubic(HermiteDerivative, P_[4], t);};

        var Ccomp = function (t) {
            var u;
            if (t<=1) {
                u = t;
                return C0(u);
            } else if (t<=2) {
                u = t-1.0;
                return C1(u);
            } else if (t<=3) {
                u = t-2.0;
                return C2(u);
            } else if (t<=4) {
                u = t-3.0;
                return C3(u);
            } else if (t<=5) {
                u = t-4.0;
                return C4(u);
            }
        };

        var Ccomp_tan = function (t) {
            var u;
            if (t<=1) {
                u = t;
                return C0_p(u);
            } else if (t<=2) {
                u = t-1.0;
                return C1_p(u);
            } else if (t<=3) {
                u = t-2.0;
                return C2_p(u);
            } else if (t<=4) {
                u = 3.0;
                return C3_p(u);
            } else if (t<=5) {
                u = t-4.0;
                return C4_p(u);
            }
        };

        function drawTrajectory(t_begin,t_end,intervals,C,Tx,color) {
	        context.strokeStyle=color;
	        context.beginPath();
            moveToTx(C(t_begin),Tx);
            for(var i=1;i<=intervals;i++){
                var t=((intervals-i)/intervals)*t_begin+(i/intervals)*t_end;
                lineToTx(C(t),Tx);
            }
            context.stroke();
	    }

	    // Create Camera
        var eye_cam = vec3.fromValues(0, 0, 0);
        var target_cam = Ccomp(tparam);
        var up_cam = vec3.fromValues(0, 1, 0);
        var Tlookat = mat4.create();
        mat4.lookAt(Tlookat, eye_cam, target_cam, up_cam);

        // Create Viewport
        var Tview = mat4.create();
        mat4.fromTranslation(Tview, [250, 250]);
        mat4.scale(Tview, Tview, [1, -1, 1]);

        // Create Projection
        var Tproj_cam = mat4.create();
        mat4.ortho(Tproj_cam, -1, 1, -1, 1, -1, 1);

        // Combine these
        var TView_Proj_Cam = mat4.create();
        mat4.multiply(TView_Proj_Cam, Tview, Tproj_cam);
        mat4.multiply(TView_Proj_Cam, TView_Proj_Cam, Tlookat);

        // Rocket Model Transform
        var Trocket = mat4.create();
        mat4.fromTranslation(Trocket, Ccomp(tparam));
        var tangent = Ccomp_tan(tparam);
        var angle = Math.atan2(tangent[1], tangent[0]);
        //mat4.rotateZ(Trocket, Trocket, angle);

        // Combine everything
        var TView_Proj_Cam_Model = mat4.create();
        mat4.multiply(TView_Proj_Cam_Model, TView_Proj_Cam, Trocket);

        drawTrajectory(0.0, 1.0, 100, C0, TView_Proj_Cam_Model, "green");
        drawTrajectory(0.0, 1.0, 100, C1, TView_Proj_Cam_Model, "green");
        drawTrajectory(0.0, 1.0, 100, C2, TView_Proj_Cam_Model, "green");
        drawTrajectory(0.0, 1.0, 100, C3, TView_Proj_Cam_Model, "green");
        drawTrajectory(0.0, 1.0, 100, C4, TView_Proj_Cam_Model, "green");
        drawRocket("red", TView_Proj_Cam_Model);

        tparam += 0.03;
        if (tparam >= 5) {
            tparam = 0;
        }
        window.requestAnimationFrame(draw);

    }

    window.requestAnimationFrame(draw);

} window.onload = setup;