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
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.core.app.ActivityOptionsCompat;
import androidx.core.content.ContextCompat;
import androidx.leanback.app.BrowseFragment;
import androidx.leanback.widget.ArrayObjectAdapter;
import androidx.leanback.widget.HeaderItem;
import androidx.leanback.widget.ImageCardView;
import androidx.leanback.widget.ListRow;
import androidx.leanback.widget.ListRowPresenter;
import androidx.leanback.widget.OnItemViewClickedListener;
import androidx.leanback.widget.Presenter;
import androidx.leanback.widget.Row;
import androidx.leanback.widget.RowPresenter;

import com.simplepathstudios.snowby.R;
import com.simplepathstudios.snowby.activity.BrowseErrorActivity;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.model.AuthenticatedUser;
import com.simplepathstudios.snowby.emby.model.ItemPage;
import com.simplepathstudios.snowby.emby.model.Login;
import com.simplepathstudios.snowby.emby.model.MediaResume;
import com.simplepathstudios.snowby.emby.model.MediaView;
import com.simplepathstudios.snowby.emby.model.User;
import com.simplepathstudios.snowby.presenter.CardPresenter;
import com.simplepathstudios.snowby.util.SnowbyConstants;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainFragment extends BrowseFragment {
    private static final String TAG = "MainFragment";

    private final ArrayObjectAdapter adapter = new ArrayObjectAdapter(new ListRowPresenter());

    @Override
    public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        setHeadersState(HEADERS_DISABLED);
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);

        setupUIElements();

        setAdapter(adapter);

        loadRows();

        setupEventListeners();
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
                                        adapter.clear();
                                        final List<MediaResume> resumeList = response.body().Items;

                                        CardPresenter cardPresenter = new CardPresenter(true, SnowbyConstants.OVERVIEW_CARD_WIDTH, SnowbyConstants.OVERVIEW_CARD_HEIGHT);

                                        ArrayObjectAdapter mediaOverviewRow = new ArrayObjectAdapter(cardPresenter);
                                        for(MediaView mediaView: overviewList){
                                            if(mediaView.CollectionType.equals("movies") || mediaView.CollectionType.equals("tvshows")){
                                                mediaOverviewRow.add(mediaView);
                                            }
                                        }
                                        if(mediaOverviewRow.size() > 0){
                                            HeaderItem mediaOverviewHeader = new HeaderItem(0, "Media");
                                            adapter.add(new ListRow(mediaOverviewHeader,mediaOverviewRow));
                                        }

                                        if(resumeList.size() > 0){
                                            ArrayObjectAdapter resumeRow = new ArrayObjectAdapter(cardPresenter);
                                            for(MediaResume mediaResume: resumeList){
                                                resumeRow.add(mediaResume);
                                            }
                                            HeaderItem resumeHeader = new HeaderItem(1, "Resume");
                                            adapter.add(new ListRow(resumeHeader,resumeRow ));
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

    private void setupUIElements() {
        setTitle(getString(R.string.browse_title));
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
    }

    private final class ItemViewClickedListener implements OnItemViewClickedListener {
        @Override
        public void onItemClicked(Presenter.ViewHolder itemViewHolder, Object item,
                                  RowPresenter.ViewHolder rowViewHolder, Row row) {
            if (item instanceof MediaView){
                MediaView mediaView = (MediaView) item;
                Log.d(TAG, "MediaPreview: "+mediaView.Name);
                Intent intent = new Intent(getActivity(), MediaLibraryActivity.class);
                intent.putExtra(MediaLibraryActivity.PARENT_ID, mediaView.Id);

                Bundle bundle =
                        ActivityOptionsCompat.makeSceneTransitionAnimation(
                                getActivity(),
                                ((ImageCardView) itemViewHolder.view).getMainImageView(),
                                MediaLibraryActivity.SHARED_ELEMENT_NAME)
                                .toBundle();
                getActivity().startActivity(intent, bundle);
            }
            else if (item instanceof String) {
                if (((String) item).contains(getString(R.string.error_fragment))) {
                    Intent intent = new Intent(getActivity(), BrowseErrorActivity.class);
                    startActivity(intent);
                } else {
                    Toast.makeText(getActivity(), ((String) item), Toast.LENGTH_SHORT).show();
                }
            }
        }
    }
}
