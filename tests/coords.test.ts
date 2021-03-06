import Coords from "../src/coords";
import {toDEC, toDMS, toDDM} from '../src/conversion';

describe("Check Valid Input", () => {
  test("Invalid Input: Text", () => {
    expect(() => {
      new Coords("invalid", "W116");
    }).toThrowError(TypeError("Invalid Input"));
  });

  test("Invalid Input: Out of Range", () => {
    expect(() => {
      new Coords(`S43°38'19.39`, `W216°14'28.86"`);
    }).toThrowError(TypeError("Invalid Range: Long"));
  });

  test("Valid Input: DMS", () => {
    expect(new Coords(`S43°38'19.39`, `W116°14'28.86"`)).toEqual({
      lat: {
        format: "DMS",
        input: "S43°38'19.39",
        signed: true,
        value: [43, 38, 19.39],
      },
      long: {
        format: "DMS",
        input: "W116°14'28.86\"",
        signed: true,
        value: [116, 14, 28.86],
      },
    });
  });

  test("Valid Input: DEC", () => {
    expect(new Coords("N38.959390°", "-95.265483°")).toEqual({
      lat: {
        format: "DEC",
        input: "N38.959390°",
        signed: false,
        value: [38.95939],
      },
      long: {
        format: "DEC",
        input: "-95.265483°",
        signed: true,
        value: [95.265483],
      },
    });
  });

  test("Valid Input: DDM", () => {
    expect(new Coords("N38°57.5634", "W95°15.92890")).toEqual({
      lat: {
        format: "DDM",
        input: "N38°57.5634",
        signed: false,
        value: [38, 57.5634],
      },
      long: {
        format: "DDM",
        input: "W95°15.92890",
        signed: true,
        value: [95, 15.9289],
      },
    });
  });
});

describe("Conversions", () => {
  test("INPUT: DEC - OUTPUT: DEC", () => {
    const position = new Coords(-43.63872, -116.24135);
    expect(position.toDEC(2)).toEqual({ lat: "-43.64", long: "-116.24" });
  });

  test("INPUT: DMS - OUTPUT: DEC", () => {
    const position = new Coords(`S43°38'19.39`, `W116°14'28.86"`);
    expect(position.toDEC()).toEqual({ lat: "-43.63872", long: "-116.24135" });
  });

  test("INPUT: DDM - OUTPUT: DEC", () => {
    const position = new Coords(`32° 18.385' N`, `122° 36.875' W`);
    expect(position.toDEC()).toEqual({ lat: "32.30642", long: "-122.61458" });
  });

  test("INPUT: DMS - OUTPUT: DMS", () => {
    const position = new Coords(`S43°38'19.39`, `W116°14'28.86"`);
    expect(position.toDMS()).toEqual({
      lat: `S43°38'19.39"`,
      long: `W116°14'28.86"`,
    });
  });

  test("INPUT: DEC - OUTPUT: DMS", () => {
    const position = new Coords(53.47872, -113.46130);
    expect(position.toDMS()).toEqual({
      lat: `N53°29'16.61"`,
      long: `W113°28'19.32"`,
    });
  });

  test("INPUT: DDM - OUTPUT: DMS", () => {
    const position = new Coords(`32° 18.385' N`, `122° 36.875' W`);
    expect(position.toDMS()).toEqual({
      lat: `N32°18'23.1"`,
      long: `W122°36'52.5"`,
    });
  });

  test("INPUT: DDM - OUTPUT: DDM", () => {
    const position = new Coords(`N32°18.385'`, `W122°36.875'`);
    expect(position.toDDM()).toEqual({
      lat: `N32°18.385'`,
      long: `W122°36.875'`,
    });
  });

  test("INPUT: DEC - OUTPUT: DDM", () => {
    const position = new Coords("-43.63872", "-116.24135");
    expect(position.toDDM()).toEqual({
      lat: `S43°38.3232'`,
      long: `W116°14.481'`,
    });
  });

  test("INPUT: DMS - OUTPUT: DDM", () => {
    const position = new Coords(`N32°18'23.1"`, `W122°36'52.5"`);
    expect(position.toDDM()).toEqual({
      lat: `N32°18.385'`,
      long: `W122°36.875'`,
    });
  });
});

describe("Batch Conversion", () => {
  test("Invalid Input: Empty Array", () => {
    expect(() => {
      toDEC([]);
    }).toThrowError(TypeError("One or more lat/long pairs invalid"));
  });

  test("Invalid Input: Missing Lat/Long Pair", () => {
    expect(() => {
      toDEC([`N32°18'23.1"`, `W122°36'52.5"`, `N32°18'23.1"`]);
    }).toThrowError(TypeError("One or more lat/long pairs invalid"));
  });

  test("Invalid Input: Out of Range", () => {
    expect(() => {
      toDEC([
        `0°18'23.1"`,
        `W222°36'52.5"`,
        `N32°18'23.1"`,
        `W122°36'52.5"`,
      ]);
    }).toThrowError(TypeError("Invalid Range: Long"));
  });

  test("INPUT: DMS - OUTPUT: DEC", () => {
    expect(
      toDEC([
        `N32°18'23.1"`,
        `W122°36'52.5"`,
        `32°18'23.1"`,
        `-122°36'52.5"`,
        `N 32 °18 23.1"`,
        `W 122° 36'52.5`,
      ])
    ).toEqual([
      { lat: "32.30642", long: "-122.61458" },
      { lat: "32.30642", long: "-122.61458" },
      { lat: "32.30642", long: "-122.61458" },
    ]);
  });

  test("INPUT: DEC - OUTPUT: DDM", () => {
    expect(
      toDDM([-43.63872, -116.24135, -43.63872, -116.24135])
    ).toEqual([
      { lat: `S43°38.3232'`, long: `W116°14.481'` },
      { lat: `S43°38.3232'`, long: `W116°14.481'` },
    ]);
  });

  test("INPUT: DDM - OUTPUT: DMS", () => {
    expect(
      toDMS([
        `S43°38.3232'`,
        `W116°14.481'`,
        `S43°38.3232'`,
        `W116°14.481'`,
      ])
    ).toEqual([
      { lat: `S43°38'19.39"`, long: `W116°14'28.86"` },
      { lat: `S43°38'19.39"`, long: `W116°14'28.86"` },
    ]);
  });

  test("INPUT: MIXED - OUTPUT: DMS", () => {
    expect(
      toDMS([
        `S43°38.3232'`,
        `W116°14'28.86"`,
        32.30642,
        `W 122° 36'52.5`,
      ])
    ).toEqual([
      { lat: `S43°38'19.39"`, long: `W116°14'28.86"` },
      { lat: `N32°18'23.11"`, long: `W122°36'52.5"` },
    ]);
  });
});
