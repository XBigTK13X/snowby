package com.simplepathstudios.snowby.emby;

import com.simplepathstudios.snowby.emby.model.AuthenticatedUser;
import com.simplepathstudios.snowby.emby.model.Item;
import com.simplepathstudios.snowby.emby.model.ItemPage;
import com.simplepathstudios.snowby.emby.model.Login;
import com.simplepathstudios.snowby.emby.model.MediaResume;
import com.simplepathstudios.snowby.emby.model.MediaView;
import com.simplepathstudios.snowby.emby.model.User;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;


public interface EmbyService {
    final String AUTH_HEADER_KEY = "X-Emby-Authorization";

    @GET("emby/users/public")
    Call<List<User>> listUsers();

    @POST("emby/users/authenticatebyname")
    Call<AuthenticatedUser> login(@Header(AUTH_HEADER_KEY) String authHeader, @Body Login login);

    @GET("emby/Users/{userId}/Views")
    Call<ItemPage<MediaView>> mediaOverview(@Header(AUTH_HEADER_KEY) String authHeader, @Path("userId") String userId);

    @GET("emby/Users/{userId}/Items/Resume")
    Call<ItemPage<MediaResume>> resumeOverview(@Header(AUTH_HEADER_KEY) String authHeader, @Path("userId") String userId);

    @GET("emby/Users/{userId}/Items/{itemId}")
    Call<Item> item(@Header(AUTH_HEADER_KEY) String authHeader, @Path("userId") String userId, @Path("itemId") String itemId);

    @GET("emby/Users/{userId}/Items")
    Call<ItemPage<Item>> items(
            @Header(AUTH_HEADER_KEY) String authHeader,
            @Path("userId") String userId,
            @Query("ParentId") String parentId,
            @Query("Recursive") String recursive,
            @Query("IncludeItemTypes") String includeItemTypes,
            @Query("SortBy") String sortBy,
            @Query("SortOrder") String sortOrder,
            @Query("Fields") String fields,
            @Query("Filters") String filters);

    @GET("emby/Shows/NextUp")
    Call<ItemPage<Item>> nextUp(@Header(AUTH_HEADER_KEY) String authHeader, @Query("SeriesId") String seriesId, @Query("UserId") String userId, @Query("Limit") String limit);

    @GET("emby/Shows/{seriesId}/Seasons")
    Call<ItemPage<Item>> seasons(@Header(AUTH_HEADER_KEY) String authHeader, @Path("seriesId") String seriesId, @Query("userId") String userId);

    @GET("emby/Shows/{seriesId}/Episodes")
    Call<ItemPage<Item>> episodes(@Header(AUTH_HEADER_KEY) String authHeader, @Path("seriesId") String seriesId, @Query("seasonId") String seasonId, @Query("userId") String userId, @Query("Fields") String fields);
}