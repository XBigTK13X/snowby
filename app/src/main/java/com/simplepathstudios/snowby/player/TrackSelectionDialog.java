package com.simplepathstudios.snowby.player;


import android.app.Dialog;
import android.content.DialogInterface;
import android.content.res.Resources;
import android.os.Bundle;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.viewpager.widget.ViewPager;
import androidx.appcompat.app.AppCompatDialog;
import android.util.SparseArray;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.SelectionOverride;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector.MappedTrackInfo;
import com.google.android.exoplayer2.ui.TrackSelectionView;
import com.google.android.exoplayer2.util.Assertions;
import com.simplepathstudios.snowby.R;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public final class TrackSelectionDialog extends DialogFragment {

    private final SparseArray<TrackSelectionViewFragment> tabFragments;
    private final ArrayList<Integer> tabTrackTypes;

    private int titleId;
    private DialogInterface.OnClickListener onClickListener;
    private DialogInterface.OnDismissListener onDismissListener;

    
    public static boolean willHaveContent(DefaultTrackSelector trackSelector) {
        MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
        return mappedTrackInfo != null && willHaveContent(mappedTrackInfo);
    }

    
    public static boolean willHaveContent(MappedTrackInfo mappedTrackInfo) {
        for (int i = 0; i < mappedTrackInfo.getRendererCount(); i++) {
            if (showTabForRenderer(mappedTrackInfo, i)) {
                return true;
            }
        }
        return false;
    }

    
    public static TrackSelectionDialog createForTrackSelector(
            DefaultTrackSelector trackSelector, DialogInterface.OnDismissListener onDismissListener) {
        MappedTrackInfo mappedTrackInfo =
                Assertions.checkNotNull(trackSelector.getCurrentMappedTrackInfo());
        TrackSelectionDialog trackSelectionDialog = new TrackSelectionDialog();
        DefaultTrackSelector.Parameters parameters = trackSelector.getParameters();
        trackSelectionDialog.init(
                 R.string.track_selection_title,
                mappedTrackInfo,
                 parameters,
                 true,
                 false,
                 (dialog, which) -> {
                    DefaultTrackSelector.ParametersBuilder builder = parameters.buildUpon();
                    for (int i = 0; i < mappedTrackInfo.getRendererCount(); i++) {
                        builder
                                .clearSelectionOverrides( i)
                                .setRendererDisabled(
                                         i,
                                        trackSelectionDialog.getIsDisabled( i));
                        List<SelectionOverride> overrides =
                                trackSelectionDialog.getOverrides( i);
                        if (!overrides.isEmpty()) {
                            builder.setSelectionOverride(
                                     i,
                                    mappedTrackInfo.getTrackGroups( i),
                                    overrides.get(0));
                        }
                    }
                    trackSelector.setParameters(builder);
                },
                onDismissListener);
        return trackSelectionDialog;
    }

    
    public static TrackSelectionDialog createForMappedTrackInfoAndParameters(
            int titleId,
            MappedTrackInfo mappedTrackInfo,
            DefaultTrackSelector.Parameters initialParameters,
            boolean allowAdaptiveSelections,
            boolean allowMultipleOverrides,
            DialogInterface.OnClickListener onClickListener,
            DialogInterface.OnDismissListener onDismissListener) {
        TrackSelectionDialog trackSelectionDialog = new TrackSelectionDialog();
        trackSelectionDialog.init(
                titleId,
                mappedTrackInfo,
                initialParameters,
                allowAdaptiveSelections,
                allowMultipleOverrides,
                onClickListener,
                onDismissListener);
        return trackSelectionDialog;
    }

    public TrackSelectionDialog() {
        tabFragments = new SparseArray<>();
        tabTrackTypes = new ArrayList<>();
        
        setRetainInstance(true);
    }

    private void init(
            int titleId,
            MappedTrackInfo mappedTrackInfo,
            DefaultTrackSelector.Parameters initialParameters,
            boolean allowAdaptiveSelections,
            boolean allowMultipleOverrides,
            DialogInterface.OnClickListener onClickListener,
            DialogInterface.OnDismissListener onDismissListener) {
        this.titleId = titleId;
        this.onClickListener = onClickListener;
        this.onDismissListener = onDismissListener;
        for (int i = 0; i < mappedTrackInfo.getRendererCount(); i++) {
            if (showTabForRenderer(mappedTrackInfo, i)) {
                int trackType = mappedTrackInfo.getRendererType( i);
                TrackGroupArray trackGroupArray = mappedTrackInfo.getTrackGroups(i);
                TrackSelectionViewFragment tabFragment = new TrackSelectionViewFragment();
                tabFragment.init(
                        mappedTrackInfo,
                         i,
                        initialParameters.getRendererDisabled( i),
                        initialParameters.getSelectionOverride( i, trackGroupArray),
                        allowAdaptiveSelections,
                        allowMultipleOverrides);
                tabFragments.put(i, tabFragment);
                tabTrackTypes.add(trackType);
            }
        }
    }

    
    public boolean getIsDisabled(int rendererIndex) {
        TrackSelectionViewFragment rendererView = tabFragments.get(rendererIndex);
        return rendererView != null && rendererView.isDisabled;
    }

    
    public List<SelectionOverride> getOverrides(int rendererIndex) {
        TrackSelectionViewFragment rendererView = tabFragments.get(rendererIndex);
        return rendererView == null ? Collections.emptyList() : rendererView.overrides;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        
        
        
        AppCompatDialog dialog =
                new AppCompatDialog(getActivity(), R.style.TrackSelectionDialogThemeOverlay);
        dialog.setTitle(titleId);
        return dialog;
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
        super.onDismiss(dialog);
        onDismissListener.onDismiss(dialog);
    }

    
    @Override
    public View onCreateView(
            LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        View dialogView = inflater.inflate(R.layout.track_selection_dialog, container, false);
        SlidingTabLayout tabLayout = dialogView.findViewById(R.id.track_selection_dialog_tab_layout);
        ViewPager viewPager = dialogView.findViewById(R.id.track_selection_dialog_view_pager);
        Button cancelButton = dialogView.findViewById(R.id.track_selection_dialog_cancel_button);
        Button okButton = dialogView.findViewById(R.id.track_selection_dialog_ok_button);
        viewPager.setAdapter(new FragmentAdapter(getChildFragmentManager()));
        tabLayout.setViewPager(viewPager);
        tabLayout.setVisibility(tabFragments.size() > 1 ? View.VISIBLE : View.GONE);
        cancelButton.setOnClickListener(view -> dismiss());
        okButton.setOnClickListener(
                view -> {
                    onClickListener.onClick(getDialog(), DialogInterface.BUTTON_POSITIVE);
                    dismiss();
                });
        return dialogView;
    }

    private static boolean showTabForRenderer(MappedTrackInfo mappedTrackInfo, int rendererIndex) {
        TrackGroupArray trackGroupArray = mappedTrackInfo.getTrackGroups(rendererIndex);
        if (trackGroupArray.length == 0) {
            return false;
        }
        int trackType = mappedTrackInfo.getRendererType(rendererIndex);
        return isSupportedTrackType(trackType);
    }

    private static boolean isSupportedTrackType(int trackType) {
        switch (trackType) {
            case C.TRACK_TYPE_VIDEO:
            case C.TRACK_TYPE_AUDIO:
            case C.TRACK_TYPE_TEXT:
                return true;
            default:
                return false;
        }
    }

    private static String getTrackTypeString(Resources resources, int trackType) {
        switch (trackType) {
            case C.TRACK_TYPE_VIDEO:
                return resources.getString(R.string.exo_track_selection_title_video);
            case C.TRACK_TYPE_AUDIO:
                return resources.getString(R.string.exo_track_selection_title_audio);
            case C.TRACK_TYPE_TEXT:
                return resources.getString(R.string.exo_track_selection_title_text);
            default:
                throw new IllegalArgumentException();
        }
    }

    private final class FragmentAdapter extends FragmentPagerAdapter {

        public FragmentAdapter(FragmentManager fragmentManager) {
            super(fragmentManager);
        }

        @Override
        public Fragment getItem(int position) {
            return tabFragments.valueAt(position);
        }

        @Override
        public int getCount() {
            return tabFragments.size();
        }

        
        @Override
        public CharSequence getPageTitle(int position) {
            return getTrackTypeString(getResources(), tabTrackTypes.get(position));
        }
    }

    
    public static final class TrackSelectionViewFragment extends Fragment
            implements TrackSelectionView.TrackSelectionListener {

        private MappedTrackInfo mappedTrackInfo;
        private int rendererIndex;
        private boolean allowAdaptiveSelections;
        private boolean allowMultipleOverrides;

         boolean isDisabled;
         List<SelectionOverride> overrides;

        public TrackSelectionViewFragment() {
            
            setRetainInstance(true);
        }

        public void init(
                MappedTrackInfo mappedTrackInfo,
                int rendererIndex,
                boolean initialIsDisabled,
                SelectionOverride initialOverride,
                boolean allowAdaptiveSelections,
                boolean allowMultipleOverrides) {
            this.mappedTrackInfo = mappedTrackInfo;
            this.rendererIndex = rendererIndex;
            this.isDisabled = initialIsDisabled;
            this.overrides =
                    initialOverride == null
                            ? Collections.emptyList()
                            : Collections.singletonList(initialOverride);
            this.allowAdaptiveSelections = allowAdaptiveSelections;
            this.allowMultipleOverrides = allowMultipleOverrides;
        }

        
        @Override
        public View onCreateView(
                LayoutInflater inflater,
                ViewGroup container,
                Bundle savedInstanceState) {
            View rootView =
                    inflater.inflate(
                            R.layout.exo_track_selection_dialog, container,  false);
            TrackSelectionView trackSelectionView = rootView.findViewById(R.id.exo_track_selection_view);
            trackSelectionView.setShowDisableOption(true);
            trackSelectionView.setAllowMultipleOverrides(allowMultipleOverrides);
            trackSelectionView.setAllowAdaptiveSelections(allowAdaptiveSelections);
            trackSelectionView.init(
                    mappedTrackInfo, rendererIndex, isDisabled, overrides,  this);
            return rootView;
        }

        @Override
        public void onTrackSelectionChanged(boolean isDisabled, List<SelectionOverride> overrides) {
            this.isDisabled = isDisabled;
            this.overrides = overrides;
        }
    }
}
