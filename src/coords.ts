import { FORMAT, VALID_RANGE, MATCH } from "../libs/constants";

type LAT_LONG = string;
interface returnLAT_LONG {
  lat: string;
  long: string;
}

interface processedLAT_LONG {
  value: Array<number> | null;
  signed: boolean;
  format: FORMAT | null;
  input: number | string;
}

export default class COORDS {


  static batch(input: Array<string>) : Array<COORDS> {
    const coords = []
    if (input.length % 2 === 0) {
      let counter = 0;
      while(counter < input.length){
        coords.push(new COORDS(input[counter], input[counter + 1]))
        counter = counter + 2
      }
    } else {
      throw new TypeError("One or more lat/long pairs invalid")
    }
    return coords;
  }

  private lat: processedLAT_LONG;
  private long: processedLAT_LONG;

  constructor(lat: LAT_LONG, long: LAT_LONG) {
    this.lat = { value: null, signed: false, format: null, input: lat };
    this.long = { value: null, signed: false, format: null, input: long };

    const inputLat = lat.match(MATCH);
    const inputLong = long.match(MATCH);

    if (inputLat === null || inputLong === null) {
      throw new TypeError("Invalid Input");
    }

    this.lat.signed = this.checkSigned(inputLat, lat);
    this.long.signed = this.checkSigned(inputLong, long);

    this.lat.value = inputLat.map((e) => Number(e));
    this.long.value = inputLong.map((e) => Number(e));

    if (
      !this.checkRange(
        this.lat.value[0],
        VALID_RANGE.LAT_MIN,
        VALID_RANGE.LAT_MAX
      )
    ) {
      throw new TypeError("Invalid Range: Lat");
    }
    if (
      !this.checkRange(
        this.long.value[0],
        VALID_RANGE.LONG_MIN,
        VALID_RANGE.LONG_MAX
      )
    ) {
      throw new TypeError("Invalid Range: Long");
    }

    this.lat.value[0] = Math.abs(Number(this.lat.value![0]));
    this.long.value[0] = Math.abs(Number(this.long.value![0]));

    this.lat.format = this.checkFormat(this.lat);
    this.long.format = this.checkFormat(this.long);
  }

  private checkRange(degrees: number, min: VALID_RANGE, max: VALID_RANGE) {
    return degrees >= min && degrees <= max;
  }

  private checkSigned(lat_long: Array<string>, input: string) {
    let [ deg ] = lat_long;
    input.match(/[Ww]/g) ? (deg = `-${deg}`) : deg;
    input.match(/[Ss]/g) ? (deg = `-${deg}`) : deg;
    return deg.charAt(0) === "-" ? true : false;
  }

  private checkFormat(lat_long: processedLAT_LONG) {
    switch (lat_long.value?.length) {
      case 1:
        return FORMAT.DEC;
      case 2:
        return FORMAT.DDM;
      case 3:
        return FORMAT.DMS;
    }
    return null;
  }

  private convertdms(
    { value, signed, format }: processedLAT_LONG,
    type: string
  ) {
    const decDeg = value![0];
    const deg = ~~value![0];
    let min = 0;
    let sec = 0;
    if (format === "DEC") {
      min = Math.round((decDeg - deg) * 60);
      sec = Number(((decDeg - deg - min / 60) * 3600).toFixed(2));
    } else if (format === "DDM") {
      min = ~~value![1];
      sec = Number(((value![1] - min) * 60).toFixed(2));
    }

    const cardinalLat = signed && type === "lat" ? "S" : "N";
    const cardinalLong = signed && type === "long" ? "W" : "E";

    return `${
      type === "lat" ? cardinalLat : cardinalLong
    }${deg}°${min}'${sec}"`;
  }

  private convertdmm(
    { value, signed, format }: processedLAT_LONG,
    type: string
  ) {
    const decDeg = value![0];
    const deg = ~~value![0];
    let min = 0;

    if (format === "DEC") {
      min = Number(((decDeg - deg) * 60).toFixed(4));
    } else if (format === "DMS") {
      min = value![1] + value![2] / 60;
    }

    const cardinalLat = signed && type === "lat" ? "S" : "N";
    const cardinalLong = signed && type === "long" ? "W" : "E";

    return `${type === "lat" ? cardinalLat : cardinalLong}${deg}°${min}'`;
  }

  toDEC(precision = 5): returnLAT_LONG | Error {
    // Decimal Degrees = Degrees + minutes/60 + seconds/3600

    if (this.lat.format === "DEC" && this.long.format === "DEC") {
      const latResult = `${
        this.lat.signed ? "-" : ""
      }${this.lat.value![0].toFixed(precision)}`;
      const longResult = `${
        this.long.signed ? "-" : ""
      }${this.long.value![0].toFixed(precision)}`;
      return { lat: latResult, long: longResult };
    }

    if (this.lat.format === "DMS" && this.long.format === "DMS") {
      const [latDeg, latMin, latSec] = this.lat.value!;
      const [longDeg, longMin, longSec] = this.long.value!;
      const latResult = `${this.lat.signed ? "-" : ""}${latDeg}.${(
        latMin / 60 +
        latSec / 3600
      )
        .toPrecision(precision)
        .match(/[^\.]\d+(\.\d+)*/g)}`;
      const longResult = `${this.long.signed ? "-" : ""}${longDeg}.${(
        longMin / 60 +
        longSec / 3600
      )
        .toPrecision(precision)
        .match(/[^\.]\d+(\.\d+)*/g)}`; // matches everything behind the decimal
      return { lat: latResult, long: longResult };
    }

    if (this.lat.format === "DDM" && this.long.format === "DDM") {
      const [latDeg, latMin] = this.lat.value!;
      const [longDeg, longMin] = this.long.value!;
      const latResult = `${this.lat.signed ? "-" : ""}${latDeg}.${(latMin / 60)
        .toPrecision(precision)
        .match(/[^\.]\d+(\.\d+)*/g)}`;
      const longResult = `${this.long.signed ? "-" : ""}${longDeg}.${(
        longMin / 60
      )
        .toPrecision(precision)
        .match(/[^\.]\d+(\.\d+)*/g)}`;
      return { lat: latResult, long: longResult };
    }

    return new TypeError("Values are not of the same type");
  }

  toDMS() {
    /*
        DMS = d + m + s
        d = int(DEC)
        m = int(DEC - d * 60)
        s = (DEC - d - m/60) * 3600
        */

    if (this.lat.format === "DMS" && this.long.format === "DMS") {
      const lat = `${this.lat.signed ? "S" : "N"}${this.lat.value![0]}°${
        this.lat.value![1]
      }'${this.lat.value![2]}"`;
      const long = `${this.long.signed ? "W" : "E"}${this.long.value![0]}°${
        this.long.value![1]
      }'${this.long.value![2]}"`;
      return { lat, long };
    }

    return {
      lat: this.convertdms(this.lat!, "lat"),
      long: this.convertdms(this.long!, "long"),
    };
  }

  toDDM() {
    if (this.lat.format === FORMAT.DDM && this.long.format === FORMAT.DDM) {
      const lat = `${this.lat.signed ? "S" : "N"}${this.lat.value![0]}°${
        this.lat.value![1]
      }'`;
      const long = `${this.long.signed ? "W" : "E"}${this.long.value![0]}°${
        this.long.value![1]
      }'`;
      return { lat, long };
    }

    return {
      lat: this.convertdmm(this.lat!, "lat"),
      long: this.convertdmm(this.long!, "long"),
    };
  }
}
