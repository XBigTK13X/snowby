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

package com.simplepathstudios.snowby.gui;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.leanback.app.VerticalGridFragment;
import androidx.leanback.widget.ArrayObjectAdapter;
import androidx.leanback.widget.OnItemViewClickedListener;
import androidx.leanback.widget.Presenter;
import androidx.leanback.widget.Row;
import androidx.leanback.widget.RowPresenter;
import androidx.leanback.widget.VerticalGridPresenter;

import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.model.Item;
import com.simplepathstudios.snowby.emby.model.ItemPage;
import com.simplepathstudios.snowby.emby.model.MediaSearchParams;
import com.simplepathstudios.snowby.util.SnowbyMediaPlayer;
import com.simplepathstudios.snowby.util.SnowbySettings;

import org.videolan.vlc.R;
import org.videolan.vlc.gui.tv.CardPresenter;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MediaLibraryFragment extends VerticalGridFragment {
    private static final String TAG = "MediaLibraryFragment";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setTitle(getString(R.string.app_name));
        //setSearchAffordanceColor(ContextCompat.getColor(getContext(), R.color.design_default_color_primary));

        VerticalGridPresenter gridPresenter = new VerticalGridPresenter();
        gridPresenter.setNumberOfColumns(SnowbySettings.getLibraryColumns());
        setGridPresenter(gridPresenter);
        ArrayObjectAdapter adapter = new ArrayObjectAdapter(
                new CardPresenter(
                    getActivity(),
                    SnowbySettings.getLibraryCardWidth(),
                    SnowbySettings.getLibraryCardHeight()
                )
        );
        setAdapter(adapter);
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onActivityCreated(savedInstanceState);

        loadGrid();

        setupEventListeners();
    }

    private void loadGrid() {
        final String libraryId = (String) getActivity().getIntent().getSerializableExtra(MediaLibraryActivity.PARENT_ID);
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.item(emby.authHeader,emby.userId, libraryId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Call<ItemPage<Item>> query = null;
                final Item embyItem = response.body();
                MediaSearchParams searchParams = new MediaSearchParams();
                if(embyItem.CollectionType != null){
                    if(embyItem.CollectionType.equals("movies")) {
                        searchParams.IncludeItemTypes = "Movie";
                        searchParams.Fields = "DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName";
                    }
                    else if(embyItem.CollectionType.equals("tvshows")){
                        searchParams.IncludeItemTypes = "Series";
                        searchParams.Fields = "BasicSyncInfo,MediaSourceCount,SortName";
                    }
                    searchParams.SortBy = "SortName";
                    searchParams.SortOrder = "Ascending";
                    searchParams.SortOrder = "Ascending";
                    searchParams.SortBy = "SortName";
                    //searchParams.Filters = "IsUnplayed";
                    query = emby.api.items(
                            emby.authHeader,
                            emby.userId,
                            libraryId,
                            searchParams.Recursive,
                            searchParams.IncludeItemTypes,
                            searchParams.SortBy,
                            searchParams.SortOrder,
                            searchParams.Fields,
                            searchParams.Filters
                    );
                }
                else {
                    if(embyItem.Type.equals("Series")){
                        query = emby.api.seasons(emby.authHeader,embyItem.Id,emby.userId);
                    }
                    else if(embyItem.Type.equals("Season")){
                        searchParams.Fields = "MediaStreams";
                        query = emby.api.episodes(emby.authHeader,embyItem.ParentId,embyItem.Id,emby.userId,searchParams.Fields);
                    }
                }
                query.enqueue(new Callback<ItemPage<Item>>() {
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

    private void setupEventListeners() {
        setOnItemViewClickedListener(new ItemViewClickedListener());
    }

    private final class ItemViewClickedListener implements OnItemViewClickedListener {
        @Override
        public void onItemClicked(Presenter.ViewHolder itemViewHolder, Object item,
                                  RowPresenter.ViewHolder rowViewHolder, Row row) {
            if (item instanceof Item) {
                final Item embyItem = (Item)item;
                if(embyItem.Type.equals("Movie") || embyItem.Type.equals("Episode")){
                    Log.d(TAG, "Selected playable media: " + embyItem.Name);
                    SnowbyMediaPlayer.INSTANCE.start(getActivity(),getContext(),embyItem.Id);
                }
                else if (embyItem.Type.equals("Series") || embyItem.Type.equals("Season")){
                    if(embyItem.Type.equals("Series")){
                        Log.d(TAG, "Selected the TV Series: "+embyItem.Name);
                    }
                    else {
                        Log.d(TAG, "Selected " + embyItem.SeriesName + " "+embyItem.Name);
                    }
                    Intent intent = new Intent(getActivity(), MediaLibraryActivity.class);
                    intent.putExtra(MediaLibraryActivity.PARENT_ID, embyItem.Id);
                    getActivity().startActivity(intent);
                }
                else{
                    Log.e(TAG,"Unhandled item selection type: "+embyItem.Type);
                }
            }
        }
    }
}
