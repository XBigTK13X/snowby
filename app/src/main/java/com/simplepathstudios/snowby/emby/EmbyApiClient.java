package com.simplepathstudios.snowby.emby;

import android.content.Context;
import android.provider.Settings;

import com.simplepathstudios.snowby.util.SnowbyConstants;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class EmbyApiClient {
    private static EmbyApiClient __instance;
    public static EmbyApiClient getInstance(Context context){
        if(__instance == null){
            __instance = new EmbyApiClient(context);
        }
        return __instance;
    }

    public final EmbyService api;
    public String authHeader;
    public String userId;

    private EmbyApiClient(Context context){
        String deviceId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(SnowbyConstants.EMBY_SERVER_ADDRESS)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        api = retrofit.create(EmbyService.class);

        authHeader = "MediaBrowser Client=\"Snowby\", Device=\"" + android.os.Build.MODEL + "\", DeviceId=\"" + deviceId + "\", Version=\"1.0.0.0\"";
    }

    public void setAccessToken(String token){
        authHeader = authHeader + ", Token=\"" + token + "\"";
    }

    public void setUserId(String id){
        userId = id;
    }
}
