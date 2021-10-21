import React, {createContext, useContext, useState, useEffect} from 'react';
import * as AuthSessions from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../services/api'

const CLIENT_ID = 'bd913073d9142854c79c';
const SCOPE = 'read:user';
const USER_STORAGE = '@reactnative_heat:user';
const TOKEN_STORAGE = '@reactnative_heat:token';

type User ={
    id: string;
    avatar_url:string;
    name: string;
    login: string;
}

type AuthContextData ={
    user: User | null;
    isSigninging: boolean;
    signIn:()=> Promise<void>;
    signOut:()=>Promise<void>;
}

type AuthProviderProps ={
    children: React.ReactNode;
}

type AuthResponse = {
    token: string;
    user:User;
}

type AuthorizationResponse ={
    params:{
        code?: string;
        error?: string;
    },
    type?: string
}


export const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps){
    const [isSigninging, setIsSigninging] = useState(true);
    const [user,setUser] = useState<User | null>(null);    
    
    async function signIn(){ 
        try{
            setIsSigninging(true);      
            const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}`;
            const authSessionResponse = await AuthSessions.startAsync({ authUrl }) as AuthorizationResponse;

            if(authSessionResponse.type === 'success' && authSessionResponse.params.error !== 'access_denied'){
                const authResponse = await api.post('/authenticate', { code: authSessionResponse.params.code});
                const { user, token} = authResponse.data as AuthResponse;                

                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user));
                await AsyncStorage.setItem(TOKEN_STORAGE, JSON.stringify(token));

            setUser(user);

        }
        setIsSigninging(false); 

        } catch(error){
            console.log(error);
        } finally{
            setIsSigninging(false)
        }
        
    }
    async function signOut() {
    
    }

    useEffect(() => {
        async function loadUserStorage() {
            const userStorage = await AsyncStorage.getItem(USER_STORAGE);
            const tokenStorage = await AsyncStorage.getItem(TOKEN_STORAGE);

            if(userStorage && tokenStorage){
                api.defaults.headers.common['Authorization'] = `Bearer ${tokenStorage}`;
                setUser(JSON.parse(userStorage));
            }   
            setIsSigninging(false);       
        }
        loadUserStorage();

    },[]);

    return (
        <AuthContext.Provider value={{
            signIn,
            signOut,
            user,
            isSigninging
        }}>

            {children}
        </AuthContext.Provider>
    )
}

function useAuth(){
    const context = useContext(AuthContext);
    return context;
}


export {  AuthProvider,  useAuth }