package com.simplepathstudios.snowby.emby;

import com.simplepathstudios.snowby.emby.User;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;


public interface EmbyService {
    final String AUTH_HEADER_KEY = "X-Emby-Authorization";

    @GET("emby/users/public")
    Call<List<User>> listUsers();

    @POST("emby/users/authenticatebyname")
    Call<AuthenticatedUser> login(@Header(AUTH_HEADER_KEY) String authHeader, @Body Login login);

    @GET("emby/Users/{userId}/Views")
    Call<ItemPage<MediaView>> mediaOverview(@Header(AUTH_HEADER_KEY) String authHeader, @Path("userId") String userId);

    @GET("http://9914.us:8096/emby/Users/{userId}/Items/Resume")
    Call<ItemPage<MediaResume>> resumeOverview(@Header(AUTH_HEADER_KEY) String authHeader, @Path("userId") String userId);
}