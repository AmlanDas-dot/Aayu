import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { AlertData } from '../components/dashboard/AlertCard';

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      // Add optional client side filtering for expiry if needed
      where('status', '==', 'Active') // assuming we set status=Active in backend
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: AlertData[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as AlertData);
      });
      setAlerts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching alerts from Firestore: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { alerts, loading };
}
