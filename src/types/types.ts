export type Drone = {
    id: string;
    type: string;
    droneId: string;
    trackId: string;
    classification: "ally" | "enemy" | "unclassified";
    droneGeom: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
    altitude: number;
    height: number;
    velocityNorth: number;
    velocityEast: number;
    velocityUp: number;
    heading: number;
    gpsTime: string;
    isSim: boolean;
};