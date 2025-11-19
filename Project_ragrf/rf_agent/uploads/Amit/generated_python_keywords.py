# Auto-generated Python keyword implementations file


def validate_products_in_mrog00_grid(mortgage_number, products):
    """
    Validates that all specified products are present in the MROG00 grid for the given mortgage number.

    Args:
        mortgage_number (str): The mortgage number to search for in the MROG00 grid.
        products (list): List of dicts, each representing a product to validate.

    Raises:
        AssertionError: If any product is not found in the MROG00 grid.
    """
    from SeleniumLibrary import SeleniumLibrary
    import time

    sl = BuiltIn().get_library_instance('SeleniumLibrary')

    # Assume the MROG00 grid is currently displayed in the browser.
    page_source = sl.get_source()

    for idx, product in enumerate(products, 1):
        for key, value in product.items():
            if value and value != 'XXXXXXX' and value != 'CYYMMDD':
                assert value in page_source, f"Product {idx}: Expected '{value}' for '{key}' not found in MROG00 grid."
    # If all assertions pass, the keyword succeeds.
