import Transformation from "./Transformation";
import {InsightError} from "./IInsightFacade";

export default class OptionHelper {
	public valid: boolean;
	public id: string;
	private anyKey: any=["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats",
		"dept", "id", "instructor", "title", "uuid","fullname","shortname","number","name","address","type","furniture"
		,"href"];

	constructor() {
		this.valid = true;
		this.id = "";
	}

	public check(query: any) {
		if (query["OPTIONS"] === undefined) {
			return false;
		}
		if (query.OPTIONS === null) {
			return false;
		}
		let keep = query["OPTIONS"]["COLUMNS"];
		if (keep === null) {
			return false;
		}else if(!(Array.isArray(keep) && keep.length > 0)){
			throw new InsightError("Col is not array or length problem");
		}else if(keep[0] === ""){
			throw new InsightError("empty string problem");
		}else if(this.checkForColString(keep)){
			throw new InsightError("wired element inside the col");
		}

		if(keep[0].includes("_")){
			this.id = keep[0].split("_")[0];
		}else{
			if(Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")
			&& Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "APPLY")){
				let tem = query.TRANSFORMATIONS.APPLY;
				let temKey = Object.keys(tem[0])[0];
				let temKey2 = Object.keys(tem[0][temKey])[0];
				let str = tem[0][temKey][temKey2];
				this.id = str.split("_")[0];
			}else {
				throw new InsightError("cannot find id in transformation");
			}

		}

		this.checkColumn(query);
		if (Object.keys(query.OPTIONS).length === 2) {
			if (!Object.prototype.hasOwnProperty.call(query.OPTIONS, "ORDER")) {
				return false;
			} else if (query.OPTIONS.ORDER === null) {
				return false;
			}
			this.checkOrder(query);
		}


		return Object.keys(query.OPTIONS.COLUMNS).length !== 0;


	}

	public getterID(): string{
		return this.id;
	}

	private checkColumn(query: any) {
		let checkID: any = [];
		if(!Object.prototype.hasOwnProperty.call(query.OPTIONS, "COLUMNS")){
			throw new InsightError("No Column");
		}
		let tempCol = query.OPTIONS.COLUMNS;
		if(!(Array.isArray(tempCol) && tempCol.length > 0)){
			throw new InsightError("Col is not array or length problem");
		}
		for (let each of tempCol){
			if(each === ""){
				throw new InsightError("format incorrect1");
			}
			if(each.includes("_")){
				this.containUnderscore(each, checkID,query);
			} else{
				if(!(Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")
					&& Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "APPLY"))){
					throw new InsightError("No applykey");
				}else{
					let tempApply = query.TRANSFORMATIONS.APPLY;
					if(query.TRANSFORMATIONS === null){
						throw new InsightError("TRANSFORMATIONS is null");
					}
					if(!Array.isArray(tempApply)){
						throw new InsightError("APPLY is not array");
					}
					let tempArr1 = [];
					for(let nestEach of tempApply){
						let tempObjKey = Object.keys(nestEach)[0];
						tempArr1.push(tempObjKey);

					}
					if(!tempArr1.includes(each)){
						throw new InsightError("No applykey");
					}
				}
			}
		}
	}

	private containUnderscore(each: any, checkID: any, query: any) {
		if (!(each.includes("_") && each.split("_").length === 2)) {
			throw new InsightError("format incorrect2");
		}
		let tempKey = each.split("_")[1];
		let tempId = each.split("_")[0];
		if (!this.anyKey.includes(tempKey)) {
			throw new InsightError("no such key");
		}
		if (checkID.length === 0) {
			checkID.push(tempId);
		} else {
			if (!checkID.includes(tempId)) {
				throw new InsightError("query on multiple dataset");
			}
		}
		if(Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")) {
			if(query.TRANSFORMATIONS === null){
				throw new InsightError("null in transformation");
			}
			if (Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "GROUP")) {
				let tempGroup = query.TRANSFORMATIONS.GROUP;
				if(!Array.isArray(tempGroup)){
					throw new InsightError("group is {}");
				}
				if (!tempGroup.includes(each)) {
					throw new InsightError("group and col key not match");
				}
			}
		}

	}

	private checkOrder(query: any) {
		let tempOrder = query.OPTIONS.ORDER;
		let tempDir = tempOrder.dir;
		if(typeof tempOrder !== "string"){
			if(Object.keys(tempOrder).length !== 2){
				throw new InsightError("Order has more keys");
			}
			if(!(Object.prototype.hasOwnProperty.call(tempOrder, "dir"))){
				throw new InsightError("there is no dir in order");
			}
			if(!(tempDir === "DOWN" || tempDir === "UP")){
				throw new InsightError("invalid dir");
			}

			if(!(Object.prototype.hasOwnProperty.call(tempOrder, "keys"))){
				throw new InsightError("there is no keys in order");
			}else{
				if(!Array.isArray(tempOrder.keys)){
					throw new InsightError("keys is not in array format");
				}
				if(tempOrder.keys.length === 0){
					throw new InsightError("keys is not in array format of zero length");
				}
			}
			this.orderCheckerHelper(tempOrder,query);
		}else if(typeof tempOrder === "string"){
			let tempCol = query.OPTIONS.COLUMNS;
			if(!tempCol.includes(tempOrder)){
				throw new InsightError("order key not in COL");
			}
			if(tempOrder.includes("_")){
				if (!(tempOrder.includes("_") && tempOrder.split("_").length === 2)) {
					throw new InsightError("format incorrect3");
				}
				let tempKey = tempOrder.split("_")[1];
				if (!this.anyKey.includes(tempKey)) {
					throw new InsightError("no such key");
				}
			}else{
				this.checkApply(query, tempOrder);
			}

		}

	}

	private checkApply(query: any, tempOrder: string) {
		if (!Object.prototype.hasOwnProperty.call(query.TRANSFORMATIONS, "APPLY")) {
			throw new InsightError("No applykey");
		} else {
			let tempApply = query.TRANSFORMATIONS.APPLY;
			if (!Array.isArray(tempApply)) {
				throw new InsightError("APPLY is not array");
			}
			let tempArr1 = [];
			for (let nestEach of tempApply) {
				let tempObjKey = Object.keys(nestEach)[0];
				tempArr1.push(tempObjKey);

			}
			if (!tempArr1.includes(tempOrder)) {
				throw new InsightError("No applykey");
			}
		}
	}

	private orderCheckerHelper(tempOrder: any,query: any) {
		for (let each of tempOrder.keys) {
			let checkID: any = [];
			if (each === "") {
				throw new InsightError("format incorrect4");
			}

			if (typeof each === "string") {
				if (each.includes("_")) {
					if (!(each.includes("_") && each.split("_").length === 2)) {
						throw new InsightError("format incorrect5");
					}
					let tempKey = each.split("_")[1];
					let tempId = each.split("_")[0];
					if (!this.anyKey.includes(tempKey)) {
						throw new InsightError("no such key");
					}
					if (checkID.length === 0) {
						checkID.push(tempId);
					} else {
						if (!checkID.includes(tempId)) {
							throw new InsightError("query on multiple dataset");
						}
					}
				}else{
					let tempApply = query.TRANSFORMATIONS.APPLY;
					let tempArr1 = [];
					for(let nestEach of tempApply){
						let tempObjKey = Object.keys(nestEach)[0];
						tempArr1.push(tempObjKey);
					}
					if(!tempArr1.includes(each)){
						throw new InsightError("apply do not has this key");
					}
				}
			}else{
				throw new InsightError("order keys incorrect");
			}
		}
	}

	private checkForColString(keep: any) {
		for(let each of keep){
			if(typeof each !== "string"){
				return true;
			}
		}
		return false;
	}
}
