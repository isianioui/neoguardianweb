import React, { createContext, useContext, useState, useEffect } from 'react';
import CollisionDetectionService from '../../services/CollisionDetectionService.js';

const CollisionDetectionContext = createContext();

export const useCollisionDetection = () => {
    const context = useContext(CollisionDetectionContext);
    if (!context) {
        throw new Error('useCollisionDetection must be used within a CollisionDetectionProvider');
    }
    return context;
};

export const CollisionDetectionProvider = ({ children }) => {
    const [collisionService, setCollisionService] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeService = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const service = new CollisionDetectionService();
                const initialized = await service.initialize();

                if (initialized) {
                    setCollisionService(service);
                    setIsInitialized(true);
                    console.log('Collision Detection Service initialized successfully');
                } else {
                    throw new Error('Failed to initialize collision detection service');
                }
            } catch (err) {
                console.error('Error initializing collision detection service:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        initializeService();

        return () => {
            if (collisionService) {
                collisionService.stopRealTimeDetection();
            }
        };
    }, []);

    const startDetection = () => {
        if (collisionService) {
            collisionService.startRealTimeDetection();
        }
    };

    const stopDetection = () => {
        if (collisionService) {
            collisionService.stopRealTimeDetection();
        }
    };

    const getStatus = () => {
        if (collisionService) {
            return collisionService.getStatus();
        }
        return null;
    };

    const getAllData = () => {
        if (collisionService) {
            return collisionService.getAllData();
        }
        return null;
    };

    const value = {
        collisionService,
        isInitialized,
        isLoading,
        error,
        startDetection,
        stopDetection,
        getStatus,
        getAllData
    };

    return (
        <CollisionDetectionContext.Provider value={value}>
            {children}
        </CollisionDetectionContext.Provider>
    );
};

export default CollisionDetectionProvider;

