"""
Desharnais Software Effort Estimation Dataset - Exploratory Data Analysis (EDA)
Project: AI-Powered Task Management SaaS (PSA)
Generates distribution plots, correlation heatmaps, missing-value reports,
and exports high-resolution visual artefacts to docs/images/ for the project assessment report.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for headless execution
import matplotlib.pyplot as plt
import seaborn as sns

def load_desharnais_data(filepath='ml-service/data/desharnais.arff'):
    """Load ARFF file and parse into a clean pandas DataFrame."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    data_started = False
    rows = []
    columns = [
        'TeamExp', 'ManagerExp', 'YearEnd', 'Transactions',
        'Entities', 'PointsAdjust', 'Envergure', 'Language', 'Effort'
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.lower().startswith('@data'):
            data_started = True
            continue
        if data_started:
            parts = [p.strip() for p in line.split(',')]
            rows.append(parts)
            
    df = pd.DataFrame(rows, columns=columns)
    
    # Replace '?' with NaN and convert types
    df = df.replace('?', np.nan)
    numeric_cols = [c for c in columns if c != 'Language']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df['Language'] = df['Language'].astype('category')
    
    # Save a clean copy as CSV
    csv_path = 'ml-service/data/desharnais.csv'
    df.to_csv(csv_path, index=False)
    print(f"[EDA] Parsed {len(df)} projects into clean CSV at {csv_path}")
    return df

def run_eda(df, output_dir='docs/images'):
    """Generate statistical summaries and export charts."""
    os.makedirs(output_dir, exist_ok=True)
    sns.set_theme(style='whitegrid', palette='muted')
    
    print("\n=======================================================")
    print("      DESHARNAIS SOFTWARE ESTIMATION DATASET EDA       ")
    print("=======================================================")
    print(f"Dataset Shape: {df.shape[0]} projects, {df.shape[1]} features\n")
    
    # 1. Missing Values Report
    print("--- 1. Missing Value Audit ---")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    missing_report = pd.DataFrame({'Missing_Count': missing, 'Missing_Percent': missing_pct})
    print(missing_report[missing_report['Missing_Count'] > 0])
    
    missing_indices = df[df.isnull().any(axis=1)].index.tolist()
    print(f"\nProjects with missing attributes (Indices): {missing_indices}")
    print("Details of incomplete records:")
    print(df.loc[missing_indices, ['TeamExp', 'ManagerExp', 'PointsAdjust', 'Effort']])
    
    # 2. Descriptive Statistics
    print("\n--- 2. Numerical Features Summary Statistics ---")
    stats = df.describe().T[['count', 'mean', 'std', 'min', '50%', 'max']]
    stats.columns = ['Count', 'Mean', 'StdDev', 'Min', 'Median (P50)', 'Max']
    print(stats.round(2))
    
    # 3. Target Distribution: Effort (Person-Hours)
    print("\n--- 3. Target Variable Analysis (Effort in Person-Hours) ---")
    effort_mean = df['Effort'].mean()
    effort_median = df['Effort'].median()
    effort_std = df['Effort'].std()
    effort_skew = df['Effort'].skew()
    print(f"Effort Mean: {effort_mean:.2f} hrs | Median: {effort_median:.2f} hrs")
    print(f"Effort StdDev: {effort_std:.2f} hrs | Skewness: {effort_skew:.2f} (Positive right-skew)")
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    sns.histplot(df['Effort'], kde=True, ax=axes[0], color='#2563eb', bins=15)
    axes[0].axvline(effort_mean, color='red', linestyle='--', label=f'Mean ({effort_mean:.0f}h)')
    axes[0].axvline(effort_median, color='green', linestyle='-', label=f'Median ({effort_median:.0f}h)')
    axes[0].set_title("Effort Distribution (Person-Hours)", fontsize=13, fontweight='bold')
    axes[0].set_xlabel("Effort (hours)")
    axes[0].legend()
    
    # Log-transformed Effort
    sns.histplot(np.log1p(df['Effort']), kde=True, ax=axes[1], color='#0d9488', bins=15)
    axes[1].set_title("Log-Transformed Effort Distribution [log(1 + Effort)]", fontsize=13, fontweight='bold')
    axes[1].set_xlabel("log(Effort)")
    plt.tight_layout()
    chart1_path = os.path.join(output_dir, 'eda_effort_distribution.png')
    plt.savefig(chart1_path, dpi=300)
    plt.close()
    print(f"[Exported] {chart1_path}")
    
    # 4. Correlation Matrix
    numeric_df = df.select_dtypes(include=[np.number])
    corr = numeric_df.corr(method='pearson')
    
    plt.figure(figsize=(10, 8))
    mask = np.triu(np.ones_like(corr, dtype=bool))
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    sns.heatmap(corr, mask=mask, cmap=cmap, vmax=1.0, vmin=-0.2, center=0,
                square=True, linewidths=.5, cbar_kws={"shrink": .8}, annot=True, fmt='.2f')
    plt.title("Desharnais Feature Correlation Heatmap (Pearson r)", fontsize=14, fontweight='bold', pad=15)
    plt.tight_layout()
    chart2_path = os.path.join(output_dir, 'eda_correlation_heatmap.png')
    plt.savefig(chart2_path, dpi=300)
    plt.close()
    print(f"[Exported] {chart2_path}")
    
    # 5. Scatter: PointsAdjust (Function Points) vs Effort
    plt.figure(figsize=(8, 6))
    sns.regplot(data=df, x='PointsAdjust', y='Effort',
                scatter_kws={'alpha':0.7, 'color':'#4f46e5'}, line_kws={'color':'#dc2626'})
    plt.title("Adjusted Function Points vs. Project Effort", fontsize=13, fontweight='bold')
    plt.xlabel("Adjusted Function Points (PointsAdjust)")
    plt.ylabel("Effort (Person-Hours)")
    plt.tight_layout()
    chart3_path = os.path.join(output_dir, 'eda_points_vs_effort.png')
    plt.savefig(chart3_path, dpi=300)
    plt.close()
    print(f"[Exported] {chart3_path}")
    
    # 6. Effort Across Programming Languages
    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df, x='Language', y='Effort', palette='Set2')
    sns.stripplot(data=df, x='Language', y='Effort', color='black', alpha=0.5, jitter=0.2)
    plt.title("Effort Distribution Across Language Categories (1, 2, 3)", fontsize=13, fontweight='bold')
    plt.xlabel("Language Category")
    plt.ylabel("Effort (Person-Hours)")
    plt.tight_layout()
    chart4_path = os.path.join(output_dir, 'eda_effort_by_language.png')
    plt.savefig(chart4_path, dpi=300)
    plt.close()
    print(f"[Exported] {chart4_path}")
    
    print("\n[EDA Complete] All key exploratory charts successfully generated.")

if __name__ == '__main__':
    df = load_desharnais_data()
    run_eda(df)
