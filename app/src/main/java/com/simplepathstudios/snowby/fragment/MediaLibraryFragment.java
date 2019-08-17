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

import androidx.leanback.app.VerticalGridFragment;
import androidx.leanback.widget.ArrayObjectAdapter;
import androidx.leanback.widget.ImageCardView;
import androidx.leanback.widget.OnItemViewClickedListener;
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

import com.simplepathstudios.snowby.emby.model.MediaSearchParams;
import com.simplepathstudios.snowby.presenter.CardPresenter;
import com.simplepathstudios.snowby.R;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.model.Item;
import com.simplepathstudios.snowby.emby.model.ItemPage;
import com.simplepathstudios.snowby.util.SnowbyConstants;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MediaLibraryFragment extends VerticalGridFragment {
    private static final String TAG = "MediaLibraryFragment";

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onActivityCreated(savedInstanceState);

        loadGrid();

        setupEventListeners();
    }

    private void loadGrid() {
        final String libraryId = (String) getActivity().getIntent().getSerializableExtra(MediaLibraryActivity.LIBRARY_ID);
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.item(emby.authHeader,emby.userId, libraryId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                final Item library = response.body();
                MediaSearchParams searchParams = new MediaSearchParams();
                if(library.CollectionType.equals("movies")) {
                    searchParams.IncludeItemTypes = "Movie";
                    searchParams.SortBy = "PremiereDate,ProductionYear,SortName";
                    searchParams.SortOrder = "Descending";
                    searchParams.Fields = "DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName";
                }
                else if(library.CollectionType.equals("tvshows")){
                    searchParams.IncludeItemTypes = "Series";
                    searchParams.SortOrder = "Ascending";
                    searchParams.SortBy = "SortName";
                    searchParams.Fields = "BasicSyncInfo,MediaSourceCount,SortName";
                }
                searchParams.Filters = "IsUnplayed";
                emby.api.items(
                        emby.authHeader,
                        emby.userId,
                        libraryId,
                        searchParams.Recursive,
                        searchParams.IncludeItemTypes,
                        searchParams.SortBy,
                        searchParams.SortOrder,
                        searchParams.Fields,
                        searchParams.Filters
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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTitle(getString(R.string.browse_title));
        setSearchAffordanceColor(ContextCompat.getColor(getContext(), R.color.search_opaque));

        VerticalGridPresenter gridPresenter = new VerticalGridPresenter();
        gridPresenter.setNumberOfColumns(3);
        setGridPresenter(gridPresenter);
        ArrayObjectAdapter adapter = new ArrayObjectAdapter(new CardPresenter(false, SnowbyConstants.EMBY_ITEM_CARD_WIDTH,SnowbyConstants.EMBY_ITEM_CARD_HEIGHT));

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
}
