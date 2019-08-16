/*
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package com.simplepathstudios.snowby.fragment;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;

import androidx.leanback.app.BackgroundManager;
import androidx.leanback.app.BrowseFragment;
import androidx.leanback.widget.ArrayObjectAdapter;
import androidx.leanback.widget.HeaderItem;
import androidx.leanback.widget.ImageCardView;
import androidx.leanback.widget.ListRow;
import androidx.leanback.widget.ListRowPresenter;
import androidx.leanback.widget.OnItemViewClickedListener;
import androidx.leanback.widget.OnItemViewSelectedListener;
import androidx.leanback.widget.Presenter;
import androidx.leanback.widget.Row;
import androidx.leanback.widget.RowPresenter;
import androidx.core.app.ActivityOptionsCompat;
import androidx.core.content.ContextCompat;

import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.GlideDrawable;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.simplepathstudios.snowby.CardPresenter;
import com.simplepathstudios.snowby.MediaCodecs;
import com.simplepathstudios.snowby.Movie;
import com.simplepathstudios.snowby.R;
import com.simplepathstudios.snowby.activity.BrowseErrorActivity;
import com.simplepathstudios.snowby.activity.DetailsActivity;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.emby.AuthenticatedUser;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.EmbyService;
import com.simplepathstudios.snowby.emby.ItemPage;
import com.simplepathstudios.snowby.emby.Login;
import com.simplepathstudios.snowby.emby.MediaPreview;
import com.simplepathstudios.snowby.emby.MediaResume;
import com.simplepathstudios.snowby.emby.MediaView;
import com.simplepathstudios.snowby.emby.User;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class MainFragment extends BrowseFragment {
    private static final String TAG = "MainFragment";

    private static final int BACKGROUND_UPDATE_DELAY = 300;
    private static final int GRID_ITEM_WIDTH = 200;
    private static final int GRID_ITEM_HEIGHT = 200;

    private final Handler mHandler = new Handler();
    private Drawable mDefaultBackground;
    private DisplayMetrics mMetrics;
    private Timer mBackgroundTimer;
    private String mBackgroundUri;
    private BackgroundManager mBackgroundManager;
    private final ArrayObjectAdapter mainAdapter = new ArrayObjectAdapter(new ListRowPresenter());

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onActivityCreated(savedInstanceState);

        prepareBackgroundManager();

        setupUIElements();

        setAdapter(mainAdapter);

        loadRows();

        setupEventListeners();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (null != mBackgroundTimer) {
            Log.d(TAG, "onDestroy: " + mBackgroundTimer.toString());
            mBackgroundTimer.cancel();
        }
    }

    private void loadRows() {
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());

        emby.api.listUsers().enqueue(new Callback<List<User>>(){
            @Override
            public void onResponse(Call<List<User>> call, Response<List<User>> response) {
                final User user = response.body().get(0);
                Login login = new Login();
                login.Username = user.Name;
                login.Pw = "";
                emby.setUserId(user.Id);
                emby.api.login(emby.authHeader, login).enqueue(new Callback<AuthenticatedUser>() {
                    @Override
                    public void onResponse(Call<AuthenticatedUser> call, Response<AuthenticatedUser> response) {
                        AuthenticatedUser authenticatedUser = response.body();
                        emby.setAccessToken(authenticatedUser.AccessToken);
                        emby.api.mediaOverview(emby.authHeader,user.Id).enqueue(new Callback<ItemPage<MediaView>>() {
                            @Override
                            public void onResponse(Call<ItemPage<MediaView>> call, Response<ItemPage<MediaView>> response) {
                                final List<MediaView> overviewList = response.body().Items;
                                emby.api.resumeOverview(emby.authHeader,user.Id).enqueue(new Callback<ItemPage<MediaResume>>() {
                                    @Override
                                    public void onResponse(Call<ItemPage<MediaResume>> call, Response<ItemPage<MediaResume>> response) {
                                        Log.i(TAG,"Data loaded, refreshing view");
                                        mainAdapter.clear();
                                        final List<MediaResume> resumeList = response.body().Items;

                                        CardPresenter cardPresenter = new CardPresenter();

                                        ArrayObjectAdapter mediaOverviewRow = new ArrayObjectAdapter(cardPresenter);
                                        for(MediaView mediaView: overviewList){
                                            mediaOverviewRow.add(mediaView);
                                        }
                                        HeaderItem mediaOverviewHeader = new HeaderItem(0, "Media");
                                        mainAdapter.add(new ListRow(mediaOverviewHeader,mediaOverviewRow));

                                        if(resumeList.size() > 0){
                                            ArrayObjectAdapter resumeRow = new ArrayObjectAdapter(cardPresenter);
                                            for(MediaResume mediaResume: resumeList){
                                                resumeRow.add(mediaResume);
                                            }
                                            HeaderItem resumeHeader = new HeaderItem(1, "Resume");
                                            mainAdapter.add(new ListRow(resumeHeader,resumeRow ));
                                        }
                                    }

                                    @Override
                                    public void onFailure(Call<ItemPage<MediaResume>> call, Throwable t) {
                                        Log.e(TAG,"An error occurred while getting in progress content",t);
                                    }
                                });
                            }
                            @Override
                            public void onFailure(Call<ItemPage<MediaView>> call, Throwable t) {
                                Log.e(TAG,"An error occurred while getting media overview",t);
                            }
                        });
                    }
                    @Override
                    public void onFailure(Call<AuthenticatedUser> call, Throwable t) {
                        Log.e(TAG,"An error occurred while logging in",t);
                    }
                });
            }
            @Override
            public void onFailure(Call<List<User>> call, Throwable t) {
                Log.e(TAG,"An error occurred while finding users",t);
            }
        });
    }

    private void prepareBackgroundManager() {

        mBackgroundManager = BackgroundManager.getInstance(getActivity());
        mBackgroundManager.attach(getActivity().getWindow());

        mDefaultBackground = ContextCompat.getDrawable(getContext(), R.drawable.default_background);
        mMetrics = new DisplayMetrics();
        getActivity().getWindowManager().getDefaultDisplay().getMetrics(mMetrics);
    }

    private void setupUIElements() {
        // setBadgeDrawable(getActivity().getResources().getDrawable(
        // R.drawable.videos_by_google_banner));
        setTitle(getString(R.string.browse_title)); // Badge, when set, takes precedent
        // over title
        setHeadersState(HEADERS_ENABLED);
        setHeadersTransitionOnBackEnabled(true);

        // set fastLane (or headers) background color
        setBrandColor(ContextCompat.getColor(getContext(), R.color.fastlane_background));
        // set search icon color
        setSearchAffordanceColor(ContextCompat.getColor(getContext(), R.color.search_opaque));
    }

    private void setupEventListeners() {
        setOnSearchClickedListener(new View.OnClickListener() {

            @Override
            public void onClick(View view) {
                Toast.makeText(getActivity(), "Implement your own in-app search", Toast.LENGTH_LONG)
                        .show();
            }
        });

        setOnItemViewClickedListener(new ItemViewClickedListener());
        setOnItemViewSelectedListener(new ItemViewSelectedListener());
    }

    private void updateBackground(String uri) {
        int width = mMetrics.widthPixels;
        int height = mMetrics.heightPixels;
        Glide.with(getActivity())
                .load(uri)
                .centerCrop()
                .error(mDefaultBackground)
                .into(new SimpleTarget<GlideDrawable>(width, height) {
                    @Override
                    public void onResourceReady(GlideDrawable resource,
                                                GlideAnimation<? super GlideDrawable>
                                                        glideAnimation) {
                        mBackgroundManager.setDrawable(resource);
                    }
                });
        mBackgroundTimer.cancel();
    }

    private void startBackgroundTimer() {
        if (null != mBackgroundTimer) {
            mBackgroundTimer.cancel();
        }
        mBackgroundTimer = new Timer();
        mBackgroundTimer.schedule(new UpdateBackgroundTask(), BACKGROUND_UPDATE_DELAY);
    }

    private final class ItemViewClickedListener implements OnItemViewClickedListener {
        @Override
        public void onItemClicked(Presenter.ViewHolder itemViewHolder, Object item,
                                  RowPresenter.ViewHolder rowViewHolder, Row row) {
            if (item instanceof MediaView){
                MediaView mediaView = (MediaView) item;
                Log.d(TAG, "MediaPreview: "+mediaView.Name);
                Intent intent = new Intent(getActivity(), MediaLibraryActivity.class);
                intent.putExtra(MediaLibraryActivity.LIBRARY_ID, mediaView.Id);

                Bundle bundle =
                        ActivityOptionsCompat.makeSceneTransitionAnimation(
                                getActivity(),
                                ((ImageCardView) itemViewHolder.view).getMainImageView(),
                                MediaLibraryActivity.SHARED_ELEMENT_NAME)
                                .toBundle();
                getActivity().startActivity(intent, bundle);
            }
            else if (item instanceof Movie) {
                Movie movie = (Movie) item;
                Log.d(TAG, "Item: " + item.toString());
                Intent intent = new Intent(getActivity(), DetailsActivity.class);
                intent.putExtra(DetailsActivity.MOVIE, movie);

                Bundle bundle = ActivityOptionsCompat.makeSceneTransitionAnimation(
                        getActivity(),
                        ((ImageCardView) itemViewHolder.view).getMainImageView(),
                        DetailsActivity.SHARED_ELEMENT_NAME)
                        .toBundle();
                getActivity().startActivity(intent, bundle);
            } else if (item instanceof String) {
                if (((String) item).contains(getString(R.string.error_fragment))) {
                    Intent intent = new Intent(getActivity(), BrowseErrorActivity.class);
                    startActivity(intent);
                } else {
                    Toast.makeText(getActivity(), ((String) item), Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    private final class ItemViewSelectedListener implements OnItemViewSelectedListener {
        @Override
        public void onItemSelected(
                Presenter.ViewHolder itemViewHolder,
                Object item,
                RowPresenter.ViewHolder rowViewHolder,
                Row row) {
            if (item instanceof Movie) {
                mBackgroundUri = ((Movie) item).getBackgroundImageUrl();
                startBackgroundTimer();
            }
        }
    }

    private class UpdateBackgroundTask extends TimerTask {

        @Override
        public void run() {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    updateBackground(mBackgroundUri);
                }
            });
        }
    }
}
