import { Drone } from "@/types/types";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface LocationData {
  lat: number;
  lng: number;
}

export type SubscriptionType = "SIM_ONLY" | "NO_SIM_ONLY" | "LOCATION_RADIUS";

export interface UseDroneSocketProps {
  url: string;
  subscriptionType?: SubscriptionType;
}

export const useDroneSocket = ({ url, subscriptionType = "NO_SIM_ONLY" }: UseDroneSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<Drone[] | null>(null);

  useEffect(() => {
    // Create the socket reference and config for connection
    const socket = io(url, {
      transports: ["websocket"],
      upgrade: false,            // Prevents trying to switch between polling and websockets
      autoConnect: true,
      rejectUnauthorized: false,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to React Native client:", socket.id);
      setIsConnected(true);

      // The client needs to send the type of service that the websocket will deliver
      // SIM_ONLY: Simulation data only
      // NO_SIM_ONLY: Real world data
      // LOCATION_RADIUS: only get the information about drones in a certain radius
      socket.emit("subscription.update", {
        subscriptionType
      });
    });

    socket.on("drones.snapshot", (data: Drone[]) => {
      setSnapshot(data);
    });

    socket.on("connect_error", (err) => {
      console.log("React Native connection error:", err.message);
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from React Native client:", reason);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const updateLocation = (location: LocationData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("client.location.update", location);
    } else {
      console.warn("Cannot update location: Socket is not connected.");
    }
  };

  return {
    isConnected,
    snapshot,
    updateLocation,
  };
};
