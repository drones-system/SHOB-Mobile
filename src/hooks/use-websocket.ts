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

export const useDroneSocket = ({ url, subscriptionType = "SIM_ONLY" }: UseDroneSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<Drone[] | null>(null);
  const lastSeenRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshot(currentSnapshot => {
        if (!currentSnapshot) return null;
        
        const now = Date.now();
        const filtered = currentSnapshot.filter(drone => {
          const lastSeen = lastSeenRef.current[drone.droneId];
          return lastSeen && (now - lastSeen) <= 10000;
        });

        return filtered.length === currentSnapshot.length ? currentSnapshot : filtered;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      console.log("Recieved snapshot with " + data.length + "drones");
      const now = Date.now();
      data.forEach(drone => {
        lastSeenRef.current[drone.droneId] = now;
      });
      setSnapshot(data);
    });

    socket.on("drone.updated", (updatedDrone: Drone) => {
      console.log("Recieved drone update with id" + updatedDrone.droneId);
      lastSeenRef.current[updatedDrone.droneId] = Date.now();
      setSnapshot((currentSnapshot) => {
        if (!currentSnapshot) return [updatedDrone];
        
        const index = currentSnapshot.findIndex(d => d.droneId === updatedDrone.droneId);
        if (index !== -1) {
          const newSnapshot = [...currentSnapshot];
          newSnapshot[index] = updatedDrone;
          return newSnapshot;
        } else {
          return [...currentSnapshot, updatedDrone];
        }
      });
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
