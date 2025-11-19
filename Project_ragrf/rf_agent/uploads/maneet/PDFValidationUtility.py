import fitz  # PyMuPDF
import pdfplumber
import requests
import PyPDF2

def validate_text_in_PDF(pdf_path, expectedText):
    """
          This Function validates expected text in given PDF
    """
    with fitz.open(pdf_path) as pdf:
        for page_num in range(len(pdf)):
            page = pdf[page_num]
            text = page.get_text()
            if expectedText in text:
                print(f"{expectedText} found on page {page_num + 1}.")
                return True
    print(f"{expectedText} not found")
    return False

def download_pdf(pdf_url,file_path):
    """
        This Function download pdf document with pdf URL/link
    """
    response = requests.get(pdf_url, verify=False)
    with open(file_path,"wb") as file:
        file.write(response.content)
    print("PDF downloaded successfully")

def extract_text_by_page(pdf_path, pageNum=1):
    """
              This Function extracts table data as list in given page for PDF
    """
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[pageNum-1]
        table = page.extract_table()
        # return "".join(page.get_text() )
        # print(f"table: {table}")

        header = table[0]
        data_rows = table[1:]
        # print(f"data_rows: {data_rows}")

    return create_Insurance_List(data_rows)


def create_Insurance_List(data_rows):
    """
        This Function creates insurance premium list from table data extracted in PDF to compare with UI values
    """
    cleaned_rows = []
    for row in data_rows:

        cleaned_row = []
        # cleaned_row = [item.split("\n")[0] for item in row]
        for cell in row[:-1]:
            if cell:
                new_cell = cell.split("\n")
                if len(new_cell)  > 1 and "(" in new_cell[-1]:
                    clean_cell = f"{new_cell[0]} {new_cell[-1]}"
                else:
                    clean_cell =  new_cell[0]
                cleaned_row.append(clean_cell)
        cleaned_rows.append(cleaned_row)
        # print(f"cleaned_rows: {cleaned_rows}")

    return  cleaned_rows