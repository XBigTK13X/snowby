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
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;

import androidx.leanback.app.BackgroundManager;
import androidx.leanback.app.VerticalGridFragment;
import androidx.leanback.widget.ArrayObjectAdapter;
import androidx.leanback.widget.ImageCardView;
import androidx.leanback.widget.OnItemViewClickedListener;
import androidx.leanback.widget.OnItemViewSelectedListener;
import androidx.leanback.widget.Presenter;
import androidx.leanback.widget.Row;
import androidx.leanback.widget.RowPresenter;
import androidx.core.app.ActivityOptionsCompat;
import androidx.core.content.ContextCompat;
import androidx.leanback.widget.VerticalGridPresenter;

import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.GlideDrawable;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.simplepathstudios.snowby.emby.model.MediaSearchParams;
import com.simplepathstudios.snowby.presenter.CardPresenter;
import com.simplepathstudios.snowby.R;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.model.Item;
import com.simplepathstudios.snowby.emby.model.ItemPage;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MediaLibraryFragment extends VerticalGridFragment {
    private static final String TAG = "MediaLibraryFragment";

    private static final int BACKGROUND_UPDATE_DELAY = 300;
    private static final int GRID_ITEM_WIDTH = 200;
    private static final int GRID_ITEM_HEIGHT = 200;

    private final Handler mHandler = new Handler();
    private Drawable mDefaultBackground;
    private DisplayMetrics mMetrics;
    private Timer mBackgroundTimer;
    private String mBackgroundUri;
    private BackgroundManager mBackgroundManager;

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onActivityCreated(savedInstanceState);

        prepareBackgroundManager();

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
        final String libraryId = (String) getActivity().getIntent().getSerializableExtra(MediaLibraryActivity.LIBRARY_ID);
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.getItem(emby.authHeader,emby.userId, libraryId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                final Item library = response.body();
                MediaSearchParams searchParams = new MediaSearchParams();
                if(library.CollectionType.equals("movies")) {
                    searchParams.IncludeItemTypes = "Movie";
                    searchParams.SortBy = "PremiereDate,ProductionYear,SortName";
                    searchParams.SortOrder = "Descending";
                }
                emby.api.getItems(
                        emby.authHeader,
                        emby.userId,
                        libraryId,
                        searchParams.Recursive,
                        searchParams.IncludeItemTypes,
                        searchParams.SortBy,
                        searchParams.SortOrder
                ).enqueue(new Callback<ItemPage<Item>>() {
                    @Override
                    public void onResponse(Call<ItemPage<Item>> call, Response<ItemPage<Item>> response) {
                        Log.i(TAG,"Data loaded, refreshing view");

                        final List<Item> libraryItems = response.body().Items;

                        ArrayObjectAdapter adapter = (ArrayObjectAdapter)getAdapter();

                        adapter.clear();

                        Log.i(TAG, "Loaded "+libraryItems.size() + " library items");

                        for(Item item: libraryItems){
                            adapter.add(item);
                        }
                    }

                    @Override
                    public void onFailure(Call<ItemPage<Item>> call, Throwable t) {
                        Log.e(TAG,"An error occurred while retrieving child items",t);
                    }
                });
            }

            @Override
            public void onFailure(Call<Item> call, Throwable t) {
                Log.e(TAG,"An error occurred while retrieving the parent",t);
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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // setBadgeDrawable(getActivity().getResources().getDrawable(
        // R.drawable.videos_by_google_banner));
        setTitle(getString(R.string.browse_title)); // Badge, when set, takes precedent
        // set search icon color
        setSearchAffordanceColor(ContextCompat.getColor(getContext(), R.color.search_opaque));


        VerticalGridPresenter gridPresenter = new VerticalGridPresenter();
        gridPresenter.setNumberOfColumns(8);
        setGridPresenter(gridPresenter);

        ArrayObjectAdapter adapter = new ArrayObjectAdapter(new CardPresenter());
        setAdapter(adapter);
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
            if (item instanceof Item) {
                final Item embyItem = (Item)item;
                if(embyItem.Type.equals("Movie")){
                    Log.d(TAG, "Playable Media: "+embyItem.Name);
                    Intent intent = new Intent(getActivity(), PlaybackVideoActivity.class);
                    intent.putExtra(PlaybackVideoActivity.PLAYBACK_TARGET, embyItem.Id);
                    Bundle bundle =
                            ActivityOptionsCompat.makeSceneTransitionAnimation(
                                    getActivity(),
                                    ((ImageCardView) itemViewHolder.view).getMainImageView(),
                                    PlaybackVideoActivity.SHARED_ELEMENT_NAME)
                                    .toBundle();
                    getActivity().startActivity(intent, bundle);
                } else{
                    Log.d(TAG, "Item: " + embyItem.Name);
                    Intent intent = new Intent(getActivity(), MediaLibraryActivity.class);
                    intent.putExtra(getResources().getString(R.string.library), embyItem.Id);

                    Bundle bundle =
                            ActivityOptionsCompat.makeSceneTransitionAnimation(
                                    getActivity(),
                                    ((ImageCardView) itemViewHolder.view).getMainImageView(),
                                    MediaLibraryActivity.SHARED_ELEMENT_NAME)
                                    .toBundle();
                    getActivity().startActivity(intent, bundle);
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
            if (item != null){
                /*
                How to show an image from the video in the background
                if (item instanceof Movie) {
                    mBackgroundUri = ((Movie) item).getBackgroundImageUrl();
                    startBackgroundTimer();
                }
                */
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
