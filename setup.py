"""
brvmpy — BRVM Financial Data Library
Installation: pip install -e .
"""

from setuptools import setup, find_packages

with open("README.md", encoding="utf-8") as f:
    long_description = f.read()

with open("requirements.txt") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="brvmpy",
    version="1.0.0",
    author="PoleFinance",
    description="BRVM historical data, fundamental analysis, and technical analysis library",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/polefinance/brvmpy",
    packages=find_packages(exclude=["tests*", "examples*", "docs*"]),
    python_requires=">=3.9",
    install_requires=requirements,
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Office/Business :: Financial",
        "Topic :: Office/Business :: Financial :: Investment",
    ],
    keywords="brvm stock market africa ivory coast senegal togo finance",
)
