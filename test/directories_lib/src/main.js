import util from "./util";
import dep from "dep";
import depUtil from "dep/util";


if(window.QUnit) {
	QUnit.equal(depUtil, "123", "meta applied");
	
} else {
	console.log(depUtil);
}


export default {name: "main", util: util, "dep": dep};
