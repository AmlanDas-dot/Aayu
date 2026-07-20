import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { GoogleMapsContext, useMapsLibrary } from '@vis.gl/react-google-maps';

type PolygonEventProps = {
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onDrag?: (e: google.maps.MapMouseEvent) => void;
  onDragStart?: (e: google.maps.MapMouseEvent) => void;
  onDragEnd?: (e: google.maps.MapMouseEvent) => void;
  onMouseOver?: (e: google.maps.MapMouseEvent) => void;
  onMouseOut?: (e: google.maps.MapMouseEvent) => void;
};

type PolygonCustomProps = {
  paths: google.maps.LatLngLiteral[] | google.maps.LatLngLiteral[][];
};

export type PolygonProps = google.maps.PolygonOptions &
  PolygonEventProps &
  PolygonCustomProps;

export const MapPolygon = forwardRef<google.maps.Polygon | null, PolygonProps>(
  (props, ref) => {
    const {
      paths,
      onClick,
      onDrag,
      onDragStart,
      onDragEnd,
      onMouseOver,
      onMouseOut,
      ...polygonOptions
    } = props;

    const map = useContext(GoogleMapsContext)?.map;
    const maps = useMapsLibrary('maps');
    const polygon = useRef<google.maps.Polygon | null>(null);

    useImperativeHandle(ref, () => polygon.current as google.maps.Polygon, []);

    useEffect(() => {
      if (!map || !maps) return;
      if (!polygon.current) {
        polygon.current = new maps.Polygon({
          paths,
          ...polygonOptions,
        });
        polygon.current.setMap(map);
      }
      return () => {
        if (polygon.current) {
          polygon.current.setMap(null);
        }
      };
      // We don't want to re-run this effect when paths/options change, we handle updates separately
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, maps]);

    // Update paths
    useEffect(() => {
      if (!polygon.current) return;
      polygon.current.setPaths(paths);
    }, [paths]);

    // Update options
    useEffect(() => {
      if (!polygon.current) return;
      polygon.current.setOptions(polygonOptions);
    }, [polygonOptions]);

    // Events
    useEffect(() => {
      if (!polygon.current) return;

      const callbacks: Record<string, ((e: google.maps.MapMouseEvent) => void) | undefined> = {
        click: onClick,
        drag: onDrag,
        dragstart: onDragStart,
        dragend: onDragEnd,
        mouseover: onMouseOver,
        mouseout: onMouseOut,
      };

      const listeners: google.maps.MapsEventListener[] = [];

      for (const [eventName, callback] of Object.entries(callbacks)) {
        if (callback) {
          listeners.push(
            google.maps.event.addListener(polygon.current, eventName, callback)
          );
        }
      }

      return () => {
        listeners.forEach(listener => listener.remove());
      };
    }, [onClick, onDrag, onDragStart, onDragEnd, onMouseOver, onMouseOut]);

    return null;
  }
);

MapPolygon.displayName = 'MapPolygon';
